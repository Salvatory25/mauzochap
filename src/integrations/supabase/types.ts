export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          business_name: string
          owner_name: string | null
          phone: string | null
          email: string | null
          account_status: Database["public"]["Enums"]["account_status"]
          package: Database["public"]["Enums"]["subscription_package"]
          expiry_date: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_name: string
          owner_name?: string | null
          phone?: string | null
          email?: string | null
          account_status?: Database["public"]["Enums"]["account_status"]
          package?: Database["public"]["Enums"]["subscription_package"]
          expiry_date?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          owner_name?: string | null
          phone?: string | null
          email?: string | null
          account_status?: Database["public"]["Enums"]["account_status"]
          package?: Database["public"]["Enums"]["subscription_package"]
          expiry_date?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          business_id: string | null
          title: string
          message: string
          type: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          business_id?: string | null
          title: string
          message: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string | null
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          business_id: string
          amount: number
          payment_reference: string
          verification_status: Database["public"]["Enums"]["payment_status"]
          payment_date: string
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          amount: number
          payment_reference: string
          verification_status?: Database["public"]["Enums"]["payment_status"]
          payment_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          amount?: number
          payment_reference?: string
          verification_status?: Database["public"]["Enums"]["payment_status"]
          payment_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      branches: {
        Row: {
          id: string
          name: string
          location: string | null
          created_at: string
          business_id: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          created_at?: string
          business_id?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          created_at?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      branch_inventory: {
        Row: {
          branch_id: string
          product_id: string
          stock_quantity: number
          business_id: string
        }
        Insert: {
          branch_id: string
          product_id: string
          stock_quantity?: number
          business_id?: string
        }
        Update: {
          branch_id?: string
          product_id?: string
          stock_quantity?: number
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      stock_transfers: {
        Row: {
          id: string
          from_branch_id: string | null
          to_branch_id: string | null
          product_id: string | null
          quantity: number
          status: string
          created_by: string | null
          created_at: string
          updated_at: string
          business_id: string
        }
        Insert: {
          id?: string
          from_branch_id?: string | null
          to_branch_id?: string | null
          product_id?: string | null
          quantity: number
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          business_id?: string
        }
        Update: {
          id?: string
          from_branch_id?: string | null
          to_branch_id?: string | null
          product_id?: string | null
          quantity?: number
          status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      product_batches: {
        Row: {
          id: string
          product_id: string
          branch_id: string
          batch_number: string
          expiry_date: string | null
          stock_quantity: number
          created_at: string
          updated_at: string
          business_id: string
        }
        Insert: {
          id?: string
          product_id: string
          branch_id: string
          batch_number: string
          expiry_date?: string | null
          stock_quantity?: number
          created_at?: string
          updated_at?: string
          business_id?: string
        }
        Update: {
          id?: string
          product_id?: string
          branch_id?: string
          batch_number?: string
          expiry_date?: string | null
          stock_quantity?: number
          created_at?: string
          updated_at?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_batches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      suppliers: {
        Row: {
          id: string
          name: string
          phone: string | null
          email: string | null
          address: string | null
          balance: number
          created_at: string
          updated_at: string
          business_id: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          email?: string | null
          address?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
          business_id?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          email?: string | null
          address?: string | null
          balance?: number
          created_at?: string
          updated_at?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      supplier_payments: {
        Row: {
          id: string
          supplier_id: string
          amount: number
          payment_method: string
          notes: string | null
          paid_by: string | null
          created_at: string
          business_id: string
        }
        Insert: {
          id?: string
          supplier_id: string
          amount: number
          payment_method: string
          notes?: string | null
          paid_by?: string | null
          created_at?: string
          business_id?: string
        }
        Update: {
          id?: string
          supplier_id?: string
          amount?: number
          payment_method?: string
          notes?: string | null
          paid_by?: string | null
          created_at?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      customer_payments: {
        Row: {
          id: string
          customer_id: string
          amount: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          received_by: string | null
          created_at: string
          business_id: string
        }
        Insert: {
          id?: string
          customer_id: string
          amount: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          received_by?: string | null
          created_at?: string
          business_id?: string
        }
        Update: {
          id?: string
          customer_id?: string
          amount?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          received_by?: string | null
          created_at?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      purchases: {
        Row: {
          id: string
          supplier_id: string | null
          branch_id: string | null
          invoice_number: string | null
          total_amount: number
          amount_paid: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
          business_id: string
        }
        Insert: {
          id?: string
          supplier_id?: string | null
          branch_id?: string | null
          invoice_number?: string | null
          total_amount?: number
          amount_paid?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          business_id?: string
        }
        Update: {
          id?: string
          supplier_id?: string | null
          branch_id?: string | null
          invoice_number?: string | null
          total_amount?: number
          amount_paid?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_items: {
        Row: {
          id: string
          purchase_id: string
          product_id: string | null
          quantity: number
          unit_cost: number
          line_total: number
          created_at: string
          business_id: string
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id?: string | null
          quantity: number
          unit_cost: number
          line_total: number
          created_at?: string
          business_id?: string
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string | null
          quantity?: number
          unit_cost?: number
          line_total?: number
          created_at?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      stock_movements: {
        Row: {
          id: string
          product_id: string
          branch_id: string | null
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          quantity_change: number
          reference_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          business_id: string
        }
        Insert: {
          id?: string
          product_id: string
          branch_id?: string | null
          movement_type: Database["public"]["Enums"]["stock_movement_type"]
          quantity_change: number
          reference_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          business_id?: string
        }
        Update: {
          id?: string
          product_id?: string
          branch_id?: string | null
          movement_type?: Database["public"]["Enums"]["stock_movement_type"]
          quantity_change?: number
          reference_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          business_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          business_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      customers: {
        Row: {
          address: string | null
          balance: number
          created_at: string
          email: string | null
          id: string
          loyalty_points: number
          name: string
          phone: string | null
          updated_at: string
          business_id: string
        }
        Insert: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          loyalty_points?: number
          name: string
          phone?: string | null
          updated_at?: string
          business_id?: string
        }
        Update: {
          address?: string | null
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
          loyalty_points?: number
          name?: string
          phone?: string | null
          updated_at?: string
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          branch_id: string | null
          business_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          branch_id?: string | null
          business_id?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          branch_id?: string | null
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          cost: number
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          low_stock_threshold: number
          name: string
          price: number
          sku: string | null
          stock_quantity: number
          updated_at: string
          business_id: string
          unit: string | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_threshold?: number
          name: string
          price?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
          business_id?: string
          unit?: string | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          low_stock_threshold?: number
          name?: string
          price?: number
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
          business_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          full_name: string | null
          id: string
          language: string
          phone: string | null
          updated_at: string
          business_id: string | null
          branch_id: string | null
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          language?: string
          phone?: string | null
          updated_at?: string
          business_id?: string | null
          branch_id?: string | null
        }
        Update: {
          business_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          language?: string
          phone?: string | null
          updated_at?: string
          business_id?: string | null
          branch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          }
        ]
      }
      invoices: {
        Row: {
          id: string
          business_id: string
          invoice_number: string | null
          sale_id: string
          customer_id: string | null
          subtotal: number
          discount: number
          tax: number
          total_amount: number
          amount_paid: number
          balance: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id?: string
          invoice_number?: string | null
          sale_id: string
          customer_id?: string | null
          subtotal?: number
          discount?: number
          tax?: number
          total_amount?: number
          amount_paid?: number
          balance?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          invoice_number?: string | null
          sale_id?: string
          customer_id?: string | null
          subtotal?: number
          discount?: number
          tax?: number
          total_amount?: number
          amount_paid?: number
          balance?: number
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          }
        ]
      }
      invoice_items: {
        Row: {
          id: string
          business_id: string
          invoice_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          business_id?: string
          invoice_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          invoice_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          subtotal?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          product_id: string | null
          product_name: string
          quantity: number
          sale_id: string
          unit_price: number
          business_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          product_id?: string | null
          product_name: string
          quantity: number
          sale_id: string
          unit_price: number
          business_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          sale_id?: string
          unit_price?: number
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      sales: {
        Row: {
          amount_paid: number
          cashier_id: string
          created_at: string
          customer_id: string | null
          discount: number
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          receipt_number: string
          status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          tax: number
          total: number
          branch_id: string | null
          business_id: string
        }
        Insert: {
          amount_paid?: number
          cashier_id: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_number: string
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax?: number
          total?: number
          branch_id?: string | null
          business_id?: string
        }
        Update: {
          amount_paid?: number
          cashier_id?: string
          created_at?: string
          customer_id?: string | null
          discount?: number
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          receipt_number?: string
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          tax?: number
          total?: number
          branch_id?: string | null
          business_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      get_business_name: { Args: { _business_id: string }; Returns: string }
      current_business_id: { Args: Record<PropertyKey, never>; Returns: string }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "manager" | "cashier" | "owner" | "super_admin"
      payment_method: "cash" | "mobile_money" | "card" | "credit" | "bank"
      sale_status: "completed" | "cancelled" | "pending"
      account_status: "pending" | "approved" | "suspended" | "rejected"
      subscription_package: "kilimanjaro" | "serengeti" | "zanzibar" | "uhuru" | "trial"
      payment_status: "unpaid" | "paid" | "waiting_verification" | "rejected"
      stock_movement_type: "sale" | "purchase" | "adjustment" | "return"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "cashier", "owner", "super_admin"],
      payment_method: ["cash", "mobile_money", "card", "credit", "bank"],
      sale_status: ["completed", "cancelled", "pending"],
      account_status: ["pending", "approved", "suspended", "rejected"],
      subscription_package: ["kilimanjaro", "serengeti", "zanzibar", "uhuru", "trial"],
      payment_status: ["unpaid", "paid", "waiting_verification"],
      stock_movement_type: ["sale", "purchase", "adjustment", "return"],
    },
  },
} as const
