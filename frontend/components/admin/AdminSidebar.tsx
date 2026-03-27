"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, LogOut, Tag, Shield, Star, Gift, Ticket, Warehouse, Folder, BarChart3, Trophy } from "lucide-react";
import { clearAdminToken } from "@/lib/api";

const MENU_ITEMS = [
  { name: "Dashboard",  icon: LayoutDashboard, path: "/admin" },
  { name: "Analytics",  icon: BarChart3,        path: "/admin/analytics" },
  { name: "Productos",  icon: ShoppingBag,      path: "/admin/products" },
  { name: "Órdenes", icon: Package, path: "/admin/orders" },
  { name: "Inventario", icon: Warehouse, path: "/admin/stock" },
  { name: "Reseñas", icon: Star, path: "/admin/reviews" },
  { name: "Clientes", icon: Users, path: "/admin/customers" },
  { name: "Recompensas", icon: Gift, path: "/admin/rewards" },
  { name: "Cupones", icon: Ticket, path: "/admin/coupons" },
  { name: "Ajustes", icon: Settings, path: "/admin/settings" },
  { name: "Estilos / Tags", icon: Tag, path: "/admin/tags" },
  { name: "Ligas", icon: Trophy, path: "/admin/leagues" },
  { name: "Equipos / Clubes", icon: Shield, path: "/admin/clubs" },
  { name: "Categorías", icon: Folder, path: "/admin/categories" },
];

const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAdminToken();
    router.push("/admin/login");
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col h-screen fixed left-0 top-0 shadow-sm">

      {/* LOGO */}
      <div className="h-20 flex items-center px-8 border-b border-slate-100">
        <span className="text-xl font-black italic tracking-tighter text-slate-800">
          ADMIN<span className="text-indigo-500">RAW</span>
        </span>
      </div>

      {/* MENÚ */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path !== "/admin" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                ? "bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-indigo-500" : ""}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* PERFIL + CERRAR SESIÓN */}
      <div className="p-4 border-t border-slate-100 space-y-1">
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-50 mb-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-xs font-black text-indigo-600">A</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Admin</p>
            <p className="text-[10px] text-slate-400">JerseysRAW</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-rose-500 hover:bg-rose-50 rounded-xl transition-colors text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;