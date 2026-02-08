import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Bell,
  FileText,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ active, setActive }) => {
  const { logout } = useAuth();

  const items = [
    { id: "dashboard", label: "Dashboard Élève", icon: LayoutDashboard },
    { id: "courses", label: "Mes cours", icon: BookOpen },
    { id: "attendance", label: "Mes présences", icon: ClipboardCheck },
    { id: "alerts", label: "Mes alertes", icon: Bell },
    { id: "justifications", label: "Mes justifications", icon: FileText },
  ];

  return (
    <aside className="w-64 bg-white border-r flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-semibold text-blue-600">
          Gestion School
        </h1>
      </div>

      <nav className="flex-1 p-4">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 ${
              active === id
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-5 h-5" />
            {label}
          </button>
        ))}
      </nav>

      <button
        onClick={() => {
          logout();
          window.location.href = "/";
        }}
        className="m-4 flex items-center gap-2 text-red-600"
      >
        <LogOut className="w-5 h-5" /> Déconnexion
      </button>
    </aside>
  );
};

export default Sidebar;