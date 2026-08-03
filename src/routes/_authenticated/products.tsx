import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useT, formatTZS } from "@/lib/i18n";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, Tags, FileUp, Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  price: z.number().min(0, "Price cannot be negative"),
  cost: z.number().min(0, "Cost cannot be negative"),
  low_stock_threshold: z.number().min(0, "Low stock threshold cannot be negative"),
  stock_quantity: z.number().min(0, "Stock cannot be negative"),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  unit: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/products")({
  component: ProductsPage,
});

type Product = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number;
  cost: number;
  stock_quantity: number;
  low_stock_threshold: number;
  category_id: string | null;
  unit: string | null;
};

type Category = {
  id: string;
  name: string;
  description: string | null;
};

function ProductsPage() {
  const t = useT();
  const qc = useQueryClient();
  const { isManager, branchId, business } = useAuth();
  const currentPackage = business?.package || "trial";
  const productLimit = currentPackage === "trial" ? 100 : 999999;
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", branchId],
    enabled: !!branchId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), branch_inventory(stock_quantity, branch_id)")
        .order("name");
        
      if (error) throw error;
      
      return data.map(p => {
        const branchStock = p.branch_inventory?.find((bi: any) => bi.branch_id === branchId);
        return {
          ...p,
          stock_quantity: branchStock?.stock_quantity || 0
        };
      });
    },
  });

  const canAddMoreProducts = products.length < productLimit;

  const filtered = products.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || "").includes(search),
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("products")}</h1>
          <p className="text-sm text-muted-foreground">{products.length} items in catalog</p>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <Dialog open={catOpen} onOpenChange={setCatOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Tags className="h-4 w-4 mr-2" /> Categories
                </Button>
              </DialogTrigger>
              <CategoriesDialog />
            </Dialog>

            <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={!canAddMoreProducts}>
                  <FileUp className="h-4 w-4 mr-2" /> Bulk Import
                </Button>
              </DialogTrigger>
              <BulkImportDialog onClose={() => setBulkOpen(false)} />
            </Dialog>

            <Dialog
              open={open}
              onOpenChange={(o) => {
                setOpen(o);
                if (!o) setEditing(null);
              }}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setEditing(null)} disabled={!canAddMoreProducts}>
                  <Plus className="h-4 w-4 mr-2" /> {t("addProduct")}
                </Button>
              </DialogTrigger>
              <ProductDialog editing={editing} onClose={() => setOpen(false)} />
            </Dialog>
          </div>
        )}
      </div>

      {!canAddMoreProducts && (
        <div className="bg-warning/10 text-warning p-4 rounded-lg text-sm border border-warning/20">
          <strong>Limit Reached:</strong> You have reached the maximum number of products for your current package ({currentPackage.toUpperCase()}). Please upgrade your subscription to add more products.
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={t("search")}
          className="pl-10"
        />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">{t("productName")}</th>
              <th className="px-4 py-3 text-left">{t("category")}</th>
              <th className="px-4 py-3 text-left">Barcode</th>
              <th className="px-4 py-3 text-right">{t("price")}</th>
              <th className="px-4 py-3 text-right">{t("stock")}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {t("loading")}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {t("noData")}
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{(p.categories as any)?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {p.barcode || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">{formatTZS(Number(p.price))}</td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-flex items-center gap-1 ${
                        p.stock_quantity <= p.low_stock_threshold
                          ? "text-destructive font-semibold"
                          : ""
                      }`}
                    >
                      {p.stock_quantity}
                      <span className="text-xs font-normal text-muted-foreground uppercase">{p.unit || "pcs"}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {isManager && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditing(p as Product);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border border-border bg-card p-3 rounded-lg mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function ProductDialog({ editing, onClose }: { editing: Product | null; onClose: () => void }) {
  const qc = useQueryClient();
  const t = useT();
  const { branchId, user } = useAuth();
  const [form, setForm] = useState({
    name: editing?.name ?? "",
    sku: editing?.sku ?? "",
    barcode: editing?.barcode ?? "",
    price: editing?.price ?? "",
    cost: editing?.cost ?? "",
    stock_quantity: editing?.stock_quantity ?? "",
    low_stock_threshold: editing?.low_stock_threshold ?? "",
    category_id: editing?.category_id ?? "",
    unit: editing?.unit ?? "pcs",
  });
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name").order("name");
      return (data ?? []) as Category[];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return toast.error("No active branch");
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        cost: Number(form.cost),
        low_stock_threshold: Number(form.low_stock_threshold),
        sku: form.sku || null,
        barcode: form.barcode || null,
        category_id: form.category_id || null,
        unit: form.unit || "pcs",
      };

      const parsed = productSchema.safeParse({ ...payload, stock_quantity: Number(form.stock_quantity) });
      if (!parsed.success) {
        parsed.error.errors.forEach((err) => toast.error(err.message));
        return;
      }

      
      let newProduct: any = null;
      if (editing) {
        const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert({ ...payload, stock_quantity: Number(form.stock_quantity) }).select().single();
        if (error) throw error;
        newProduct = data;
        
        await supabase.from("branch_inventory").insert({
          branch_id: branchId,
          product_id: newProduct.id,
          stock_quantity: Number(form.stock_quantity),
        });
        
        if (Number(form.stock_quantity) > 0) {
          await supabase.from("stock_movements").insert({
            product_id: newProduct.id,
            branch_id: branchId,
            movement_type: "adjustment",
            quantity_change: Number(form.stock_quantity),
            created_by: user?.id
          });
        }
      }
      
      toast.success(editing ? "Updated" : "Created");
      qc.invalidateQueries({ queryKey: ["products"] });
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{editing ? t("edit") : t("addProduct")}</DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-3">
            <div>
              <Label>{t("productName")}</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("category")}</Label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-9"
                >
                  <option value="">None</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-1">To add a new category, use the 'Categories' button on the main Products page.</p>
              </div>
              <div>
                <Label>Unit (e.g. pcs, kg, L)</Label>
                <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <Label>Barcode</Label>
          <Input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("price")} (TZS)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>{t("cost")} (TZS)</Label>
            <Input
              type="number"
              step="0.01"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>{t("stock")}</Label>
            <Input
              type="number"
              value={form.stock_quantity}
              onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
              disabled={!!editing}
            />
            {!!editing && <p className="text-[10px] text-muted-foreground mt-1">Use Inventory to adjust stock.</p>}
          </div>
          <div>
            <Label>{t("lowStockAlert")}</Label>
            <Input
              type="number"
              value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "..." : t("save")}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function CategoriesDialog() {
  const qc = useQueryClient();
  const t = useT();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return (data ?? []) as Category[];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("categories").insert({ name, description: desc || null });
    setSaving(false);
    if (error) return toast.error(error.message);
    setName("");
    setDesc("");
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const deleteCat = async (id: string) => {
    if (!confirm("Delete category? Products in this category will remain but without a category.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Manage Categories</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <form onSubmit={submit} className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Electronics" />
          </div>
          <div className="flex-1">
            <Label>Description</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" />
          </div>
          <Button type="submit" disabled={saving || !name.trim()}>
            Add
          </Button>
        </form>

        <div className="border border-border rounded-md max-h-[40vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No categories yet</div>
          ) : (
            <div className="divide-y divide-border">
              {categories.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-3 text-sm">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteCat(c.id)} className="h-8 w-8">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DialogContent>
  );
}

function BulkImportDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const t = useT();
  const { branchId, user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);

  const handleDownloadTemplate = () => {
    const headers = ["Name", "Category", "Barcode", "Price", "Cost", "Stock", "Low Stock Alert", "Unit"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\nExample Product,Electronics,123456789,15000,10000,50,5,pcs";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mauzochap_products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!file) return toast.error("Please select a file");
    if (!branchId) return toast.error("No active branch");

    setImporting(true);
    setResults(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          const errors: string[] = [];
          const validProducts: any[] = [];

          // 1. Process Categories
          const uniqueCategories = Array.from(new Set(rows.map(r => r["Category"]?.trim()).filter(Boolean)));
          
          const { data: existingCats } = await supabase.from("categories").select("id, name");
          const catMap = new Map((existingCats || []).map(c => [c.name.toLowerCase(), c.id]));

          for (const catName of uniqueCategories) {
            if (!catMap.has((catName as string).toLowerCase())) {
              const { data: newCat } = await supabase.from("categories").insert({ name: catName }).select("id, name").single();
              if (newCat) catMap.set(newCat.name.toLowerCase(), newCat.id);
            }
          }

          // 2. Prepare Product Data
          for (const [index, row] of rows.entries()) {
            const name = row["Name"]?.trim();
            const price = parseFloat(row["Price"]);
            
            if (!name) {
              errors.push(`Row ${index + 1}: Name is required`);
              continue;
            }
            if (isNaN(price)) {
              errors.push(`Row ${index + 1}: Price is required and must be a number`);
              continue;
            }

            const catName = row["Category"]?.trim();
            const catId = catName ? catMap.get(catName.toLowerCase()) : null;

            validProducts.push({
              name,
              price,
              cost: parseFloat(row["Cost"]) || 0,
              barcode: row["Barcode"]?.trim() || null,
              category_id: catId,
              stock_quantity: parseInt(row["Stock"]) || 0,
              low_stock_threshold: parseInt(row["Low Stock Alert"]) || 5,
              unit: row["Unit"]?.trim() || "pcs",
            });
          }

          if (validProducts.length === 0) {
            setImporting(false);
            setResults({ success: 0, errors: ["No valid products found in CSV"] });
            return;
          }

          // 3. Insert Products
          const productsToInsert = validProducts.map(({ stock_quantity, ...rest }) => rest);
          const { data: insertedProducts, error: pErr } = await supabase.from("products").insert(productsToInsert).select("id");
          if (pErr) throw pErr;

          // 4. Insert Inventory & Movements
          const inventoryToInsert: { branch_id: string; product_id: string; stock_quantity: number }[] = [];
          const movementsToInsert: { product_id: string; branch_id: string; movement_type: "sale" | "purchase" | "adjustment" | "return"; quantity_change: number; created_by?: string }[] = [];

          for (let i = 0; i < insertedProducts.length; i++) {
            const product = insertedProducts[i];
            const stock = validProducts[i].stock_quantity;
            
            inventoryToInsert.push({
              branch_id: branchId,
              product_id: product.id,
              stock_quantity: stock
            });

            if (stock > 0) {
              movementsToInsert.push({
                product_id: product.id,
                branch_id: branchId,
                movement_type: "adjustment",
                quantity_change: stock,
                created_by: user?.id
              });
            }
          }

          const { error: invErr } = await supabase.from("branch_inventory").insert(inventoryToInsert);
          if (invErr) throw invErr;

          if (movementsToInsert.length > 0) {
            const { error: movErr } = await supabase.from("stock_movements").insert(movementsToInsert);
            if (movErr) throw movErr;
          }

          setResults({ success: insertedProducts.length, errors });
          qc.invalidateQueries({ queryKey: ["products"] });
          qc.invalidateQueries({ queryKey: ["categories"] });
          
        } catch (err: any) {
          toast.error(err.message || "Import failed");
        } finally {
          setImporting(false);
        }
      },
      error: (error) => {
        toast.error("Failed to parse CSV: " + error.message);
        setImporting(false);
      }
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Bulk Import Products</DialogTitle>
      </DialogHeader>
      
      {!results ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <h3 className="font-medium text-sm">How it works</h3>
            <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
              <li>Download the template CSV below.</li>
              <li>Fill it in using Excel or Google Sheets.</li>
              <li>Upload the saved CSV file here.</li>
              <li>We will automatically create missing categories.</li>
            </ol>
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full mt-2">
              <Download className="h-4 w-4 mr-2" /> Download Template
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Select CSV File</Label>
            <Input 
              type="file" 
              accept=".csv" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={handleImport} disabled={!file || importing}>
              {importing ? "Importing..." : "Start Import"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <h3 className="text-xl font-bold">Import Complete!</h3>
          <p className="text-muted-foreground">
            Successfully imported {results.success} products.
          </p>
          
          {results.errors.length > 0 && (
            <div className="text-left mt-4 max-h-32 overflow-y-auto rounded bg-destructive/10 p-3 text-xs text-destructive">
              <p className="font-semibold mb-1">Errors skipped:</p>
              <ul className="list-disc pl-4 space-y-1">
                {results.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <Button onClick={onClose} className="w-full mt-6">Done</Button>
        </div>
      )}
    </DialogContent>
  );
}
