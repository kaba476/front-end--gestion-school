import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = user?.role === "ADMIN"
    ? "/dashboard/admin"
    : user?.role === "PROF"
      ? "/dashboard/prof"
      : user?.role === "ELEVE"
        ? "/dashboard/eleve"
        : "/login";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 sm:p-12 max-w-md w-full text-center">
        <p className="text-6xl sm:text-7xl font-bold text-slate-200">404</p>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mt-4">
          Page non trouvée
        </h1>
        <p className="text-slate-600 mt-2">
          L’adresse demandée n’existe pas ou a été déplacée.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <Link
            to={dashboardPath}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            {user ? "Tableau de bord" : "Connexion"}
          </Link>
        </div>
      </div>
    </div>
  );
}
