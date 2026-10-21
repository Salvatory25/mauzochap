import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Sparkles, Check, ArrowRight, Store, User, Phone, MapPin } from "lucide-react";
import { LandingTranslation } from "./landing-i18n";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: LandingTranslation;
  defaultPlan?: "starter" | "kilimanjaro" | "serengeti";
}

export function RegisterModal({
  isOpen,
  onClose,
  t,
  defaultPlan = "kilimanjaro",
}: RegisterModalProps) {
  const m = t.modal;
  const navigate = useNavigate();

  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("Dar es Salaam");
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "kilimanjaro" | "serengeti">(
    defaultPlan,
  );
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onClose();
      // Redirect to auth with pre-filled state
      navigate({
        to: "/auth",
        search: {
          mode: "signup",
          package: selectedPlan,
        },
      });
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-[28px] border border-purple-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-violet-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center font-black text-sm text-white">
              M
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">{m.title}</h3>
              <p className="text-xs text-violet-200">{m.subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Shop Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-violet-600" />
              <span>{m.shopName}</span>
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder={m.shopPlaceholder}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Owner Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-600" />
              <span>{m.ownerName}</span>
            </label>
            <input
              type="text"
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={m.ownerPlaceholder}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Phone & Region row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-violet-600" />
                <span>{m.phone}</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={m.phonePlaceholder}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-violet-600" />
                <span>{m.region}</span>
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent transition-all"
              >
                {m.regions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan Choice Pills */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-800">{m.selectPlan}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "starter" as const, name: "Starter", price: "TSh 10,500" },
                {
                  id: "kilimanjaro" as const,
                  name: "Kilimanjaro",
                  price: "TSh 15,500",
                  popular: true,
                },
                { id: "serengeti" as const, name: "Serengeti", price: "TSh 25,500" },
              ].map((pl) => (
                <button
                  type="button"
                  key={pl.id}
                  onClick={() => setSelectedPlan(pl.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                    selectedPlan === pl.id
                      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white"
                  }`}
                >
                  {pl.popular && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                      Popular
                    </span>
                  )}
                  <div className="font-bold text-[11px] truncate">{pl.name}</div>
                  <div
                    className={`text-[10px] font-mono mt-0.5 ${selectedPlan === pl.id ? "text-violet-100" : "text-slate-500"}`}
                  >
                    {pl.price}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {m.closeBtn}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-xs font-bold shadow-md shadow-violet-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{loading ? m.loadingBtn : m.submitBtn}</span>
              {!loading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
