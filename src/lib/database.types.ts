export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "13.0.5"
    }
    public: {
        Tables: {
            allowed_emails: {
                Row: {
                    created_at: string
                    email: string
                }
                Insert: {
                    created_at?: string
                    email: string
                }
                Update: {
                    created_at?: string
                    email?: string
                }
                Relationships: []
            }
            clients: {
                Row: {
                    address: string | null
                    created_at: string | null
                    created_by: string | null
                    email: string | null
                    id: string
                    name: string
                    phone: string | null
                    status: Database["public"]["Enums"]["client_status"]
                }
                Insert: {
                    address?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    email?: string | null
                    id?: string
                    name: string
                    phone?: string | null
                    status?: Database["public"]["Enums"]["client_status"]
                }
                Update: {
                    address?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    email?: string | null
                    id?: string
                    name?: string
                    phone?: string | null
                    status?: Database["public"]["Enums"]["client_status"]
                }
                Relationships: [
                    {
                        foreignKeyName: "clients_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            order_attachments: {
                Row: {
                    created_at: string | null
                    id: string
                    order_id: string | null
                    storage_path: string
                    type: string
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    order_id?: string | null
                    storage_path: string
                    type: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    order_id?: string | null
                    storage_path?: string
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "order_attachments_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                ]
            }
            orders: {
                Row: {
                    client_id: string | null
                    created_at: string | null
                    description: string | null
                    id: string
                    location: string | null
                    order_number: string
                    product_id: string | null
                    solicitant_id: string | null
                    status: string
                }
                Insert: {
                    client_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    location?: string | null
                    order_number: string
                    product_id?: string | null
                    solicitant_id?: string | null
                    status?: string
                }
                Update: {
                    client_id?: string | null
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    location?: string | null
                    order_number?: string
                    product_id?: string | null
                    solicitant_id?: string | null
                    status?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "orders_client_id_fkey"
                        columns: ["client_id"]
                        isOneToOne: false
                        referencedRelation: "clients"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "orders_product_id_fkey"
                        columns: ["product_id"]
                        isOneToOne: false
                        referencedRelation: "products"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "orders_solicitant_id_fkey"
                        columns: ["solicitant_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            products: {
                Row: {
                    created_at: string | null
                    description: string | null
                    id: string
                    name: string
                    unit_table_name: string | null
                }
                Insert: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name: string
                    unit_table_name?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string | null
                    id?: string
                    name?: string
                    unit_table_name?: string | null
                }
                Relationships: []
            }
            profiles: {
                Row: {
                    created_at: string | null
                    email: string | null
                    first_name: string | null
                    id: string
                    last_name: string | null
                    role: string
                }
                Insert: {
                    created_at?: string | null
                    email?: string | null
                    first_name?: string | null
                    id: string
                    last_name?: string | null
                    role?: string
                }
                Update: {
                    created_at?: string | null
                    email?: string | null
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    role?: string
                }
                Relationships: []
            }
            receipts: {
                Row: {
                    generation_date: string | null
                    id: string
                    sale_id: string | null
                    storage_path: string
                }
                Insert: {
                    generation_date?: string | null
                    id?: string
                    sale_id?: string | null
                    storage_path: string
                }
                Update: {
                    generation_date?: string | null
                    id?: string
                    sale_id?: string | null
                    storage_path?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "receipts_sale_id_fkey"
                        columns: ["sale_id"]
                        isOneToOne: true
                        referencedRelation: "sales"
                        referencedColumns: ["id"]
                    },
                ]
            }
            sale_items: {
                Row: {
                    created_at: string | null
                    id: string
                    item_key: string
                    item_unit: string
                    item_value: number
                    sale_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    item_key: string
                    item_unit: string
                    item_value: number
                    sale_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    item_key?: string
                    item_unit?: string
                    item_value?: number
                    sale_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "sale_items_sale_id_fkey"
                        columns: ["sale_id"]
                        isOneToOne: false
                        referencedRelation: "sales"
                        referencedColumns: ["id"]
                    },
                ]
            }
            sales: {
                Row: {
                    admin_id: string | null
                    created_at: string | null
                    created_by: string | null
                    height: number | null
                    id: string
                    length: number | null
                    order_id: string | null
                    sale_code: string
                    sale_description: string | null
                    status: string
                }
                Insert: {
                    admin_id?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    height?: number | null
                    id?: string
                    length?: number | null
                    order_id?: string | null
                    sale_code: string
                    sale_description?: string | null
                    status?: string
                }
                Update: {
                    admin_id?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    height?: number | null
                    id?: string
                    length?: number | null
                    order_id?: string | null
                    sale_code?: string
                    sale_description?: string | null
                    status?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "sales_admin_id_fkey"
                        columns: ["admin_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "sales_order_id_fkey"
                        columns: ["order_id"]
                        isOneToOne: false
                        referencedRelation: "orders"
                        referencedColumns: ["id"]
                    },
                ]
            }
            tabla_gavioflex_units: {
                Row: {
                    altura: number
                    "canasta de 1,5x1x1": number
                    "canasta de 2x1x0,5": number
                    "canasta de 2x1x1": number
                    "geotextil 1600": number
                    "geotextil planar": number
                    id: string
                    "seccion de muro": number
                    "toba cemento": number
                    tuberia: number
                }
                Insert: {
                    altura: number
                    "canasta de 1,5x1x1"?: number
                    "canasta de 2x1x0,5"?: number
                    "canasta de 2x1x1"?: number
                    "geotextil 1600"?: number
                    "geotextil planar"?: number
                    id?: string
                    "seccion de muro"?: number
                    "toba cemento"?: number
                    tuberia?: number
                }
                Update: {
                    altura?: number
                    "canasta de 1,5x1x1"?: number
                    "canasta de 2x1x0,5"?: number
                    "canasta de 2x1x1"?: number
                    "geotextil 1600"?: number
                    "geotextil planar"?: number
                    id?: string
                    "seccion de muro"?: number
                    "toba cemento"?: number
                    tuberia?: number
                }
                Relationships: []
            }
            tabla_gavioterranet_units: {
                Row: {
                    altura: number
                    "canasta de 1,5x1x1": number
                    "canasta de 2x1x0,5": number
                    "canasta de 2x1x1": number
                    "geotextil 10000": number
                    "geotextil 1600": number
                    "geotextil 1700": number
                    "geotextil 2100": number
                    "geotextil 2400": number
                    "geotextil 3000": number
                    "geotextil 4000": number
                    "geotextil 5000": number
                    "geotextil 6000": number
                    "geotextil planar": number
                    id: string
                    "seccion de muro": number
                    "toba cemento": number
                    tuberia: number
                }
                Insert: {
                    altura: number
                    "canasta de 1,5x1x1"?: number
                    "canasta de 2x1x0,5"?: number
                    "canasta de 2x1x1"?: number
                    "geotextil 10000"?: number
                    "geotextil 1600"?: number
                    "geotextil 1700"?: number
                    "geotextil 2100"?: number
                    "geotextil 2400"?: number
                    "geotextil 3000"?: number
                    "geotextil 4000"?: number
                    "geotextil 5000"?: number
                    "geotextil 6000"?: number
                    "geotextil planar"?: number
                    id?: string
                    "seccion de muro"?: number
                    "toba cemento"?: number
                    tuberia?: number
                }
                Update: {
                    altura?: number
                    "canasta de 1,5x1x1"?: number
                    "canasta de 2x1x0,5"?: number
                    "canasta de 2x1x1"?: number
                    "geotextil 10000"?: number
                    "geotextil 1600"?: number
                    "geotextil 1700"?: number
                    "geotextil 2100"?: number
                    "geotextil 2400"?: number
                    "geotextil 3000"?: number
                    "geotextil 4000"?: number
                    "geotextil 5000"?: number
                    "geotextil 6000"?: number
                    "geotextil planar"?: number
                    id?: string
                    "seccion de muro"?: number
                    "toba cemento"?: number
                    tuberia?: number
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            add_column_to_table: {
                Args: { p_column_name: string; p_table_name: string }
                Returns: undefined
            }
            drop_column_from_table: {
                Args: { p_column_name: string; p_table_name: string }
                Returns: undefined
            }
            get_order_status_distribution: {
                Args: never
                Returns: {
                    status: string
                    status_count: number
                }[]
            }
            get_order_total_length: { Args: { p_order_id: string }; Returns: number }
            get_order_totals_by_id: {
                Args: { p_order_id: string }
                Returns: {
                    item_key: string
                    item_unit: string
                    total_value: number
                }[]
            }
            get_table_columns: {
                Args: { table_name_text: string }
                Returns: {
                    column_name: string
                }[]
            }
            rename_column_in_table: {
                Args: {
                    p_table_name: string
                    p_old_column_name: string
                    p_new_column_name: string
                }
                Returns: undefined
            }
            get_user_role: { Args: never; Returns: string }
        }
        Enums: {
            client_status: "Active" | "Inactive" | "Pending"
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
            client_status: ["Active", "Inactive", "Pending"],
        },
    },
} as const
