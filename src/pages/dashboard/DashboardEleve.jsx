import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useError } from "../../context/ErrorContext";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";

import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  Bell,
  FileText,
  LogOut,
  Calendar,
  Send,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

export default function DashboardEleve() {
  const { user, token, logout } = useAuth();
  const { showError, showSuccess } = useError();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Données récupérées depuis l'API
  const [cours, setCours] = useState([]);
  const [presences, setPresences] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [justificationTexts, setJustificationTexts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔄 Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      setError("");

      try {
        const coursData = await api.get("/cours/eleve", token);
        setCours(coursData);

        const presencesData = await api.get("/presences/eleve", token);
        setPresences(presencesData);

        const justifsData = await api.get("/justifications/eleve", token);
        setJustifications(justifsData);

        const alertesData = await api.get("/alertes/eleve", token);
        setAlertes(alertesData);

        const notificationsData = await api.get("/notifications/eleve", token);
        setNotifications(notificationsData);
      } catch (err) {
        console.error(err);
        setError(err.message || "Erreur lors du chargement des données.");
        showError(err.message || "Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, showError]);

  // 📨 Envoi d'une justification
  const handleSendJustification = async (presenceId) => {
    const motif = justificationTexts[presenceId] || "";
    if (!motif.trim()) {
      showError("Veuillez saisir un motif de justification.");
      return;
    }

    try {
      await api.post(
        "/justifications",
        { presence: presenceId, motif: motif },
        token
      );

      setJustificationTexts((prev) => {
        const newTexts = { ...prev };
        delete newTexts[presenceId];
        return newTexts;
      });

      const justifsData = await api.get("/justifications/eleve", token);
      setJustifications(justifsData);
      showSuccess("Justification envoyée avec succès.");
    } catch (err) {
      console.error(err);
      showError(err.message || "Erreur lors de l'envoi de la justification.");
    }
  };

  // ✅ Marquer une alerte comme lue
  const handleMarkAlerteLu = async (alerteId) => {
    try {
      await api.patch(`/alertes/${alerteId}/lu`, {}, token);
      const alertesData = await api.get("/alertes/eleve", token);
      setAlertes(alertesData);
    } catch (err) {
      console.error(err);
      showError(err.message || "Erreur lors de la mise à jour de l'alerte.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Calculer les statistiques
  const totalPresences = presences.length;
  const presentCount = presences.filter((p) => p.etat === "present").length;
  const absentCount = presences.filter((p) => p.etat === "absent").length;
  const retardCount = presences.filter((p) => p.etat === "retard").length;
  const alertesNonLues = alertes.filter((a) => !a.lu).length;
  const notificationsNonLues = notifications.filter((n) => !n.lu).length;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "cours", label: "Mes cours", icon: BookOpen, badge: cours.length },
    { id: "presences", label: "Présences", icon: ClipboardCheck },
    { id: "alertes", label: "Alertes", icon: Bell, badge: alertesNonLues },
    { id: "justifications", label: "Justifications", icon: FileText },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* ===== OVERLAY MOBILE ===== */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ===== SIDEBAR — harmonie Login (slate-800, emerald) ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-800 text-white flex flex-col shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-700">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-xl font-semibold tracking-tight">Gestion Scolaire</span>
                <p className="text-xs text-slate-400 mt-0.5">Espace Élève</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-700/50 rounded-xl p-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-600 text-emerald-400 font-semibold text-sm">
                {user?.prenom?.[0]}
                {user?.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm">{user?.prenom} {user?.nom}</p>
                <p className="text-xs text-slate-400 truncate">Élève</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-700 text-emerald-400 border-l-2 border-emerald-400"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${item.id === "alertes" ? "bg-red-500/80 text-white" : "bg-slate-600 text-slate-200"}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-red-500/20 hover:text-red-300 font-medium text-sm transition-colors mt-4 border border-slate-600"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="lg:ml-72 min-h-screen flex-1">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              {activeNav === "dashboard" && "Tableau de bord"}
              {activeNav === "cours" && "Mes cours"}
              {activeNav === "presences" && "Présences"}
              {activeNav === "alertes" && "Alertes"}
              {activeNav === "justifications" && "Justifications"}
            </h1>
            <p className="text-sm text-slate-500 truncate">
              Bienvenue, {user?.prenom} {user?.nom}
            </p>
          </div>
          {notificationsNonLues > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">{notificationsNonLues}</span>
            </div>
          )}
        </header>

        <div className="p-4 sm:p-6 bg-slate-100">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-6 h-6 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium text-sm">Chargement des données...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm flex-1">{error}</p>
            </div>
          )}

          {!loading && !error && activeNav === "dashboard" && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Total Présences */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow border border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700 text-emerald-400">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold text-slate-800">{totalPresences}</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-600">Total Présences</h3>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow border border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold text-slate-800">{presentCount}</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-600">Présent</h3>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow border border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 text-red-600">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold text-slate-800">{absentCount}</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-600">Absent</h3>
                </div>
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow border border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-100 text-amber-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold text-slate-800">{retardCount}</span>
                  </div>
                  <h3 className="text-sm font-medium text-slate-600">Retard</h3>
                </div>
              </div>

              {notifications.length > 0 && (
                <div className="mt-6 bg-white rounded-xl p-4 shadow border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <h4 className="font-bold text-slate-800">Notifications</h4>
                    {notificationsNonLues > 0 && (
                      <span className="bg-slate-700 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {notificationsNonLues}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`p-3 rounded-lg border text-sm ${n.lu ? "bg-slate-50 border-slate-200" : "bg-slate-100 border-slate-300"}`}
                      >
                        <p className="text-slate-800">{n.message}</p>
                        <p className="text-xs text-slate-500 mt-1">{new Date(n.date).toLocaleDateString("fr-FR")}</p>
                        {!n.lu && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await api.patch(`/notifications/${n._id}/lu`, {}, token);
                                const notifsData = await api.get("/notifications/eleve", token);
                                setNotifications(notifsData);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="mt-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                          >
                            Marquer lue
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && !error && activeNav === "cours" && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700 text-emerald-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Mes cours</h4>
              </div>
              {cours.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">Aucun cours trouvé</p>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {cours.map((c) => (
                    <div
                      key={c._id}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-semibold text-slate-800 truncate">{c.nom}</p>
                        {c.professeur && (
                          <p className="text-sm text-slate-500 truncate">
                            Prof : {c.professeur.prenom} {c.professeur.nom}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && !error && activeNav === "presences" && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700 text-emerald-400">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Mes présences</h4>
              </div>
              {presences.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">Aucune présence enregistrée</p>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {presences.map((p) => (
                    <div
                      key={p._id}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <p className="font-semibold text-slate-800 flex-1 min-w-0 truncate">
                          {p.cours?.nom || "Cours inconnu"}
                        </p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                            p.etat === "present"
                              ? "bg-emerald-100 text-emerald-700"
                              : p.etat === "absent"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {p.etat?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(p.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && !error && activeNav === "alertes" && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-100 text-red-600">
                  <Bell className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Mes alertes</h4>
                {alertesNonLues > 0 && (
                  <span className="ml-auto bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold">
                    {alertesNonLues}
                  </span>
                )}
              </div>
              {alertes.length === 0 ? (
                <p className="text-slate-500 text-center py-8 text-sm">Aucune alerte pour le moment</p>
              ) : (
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {alertes.map((a) => (
                    <div
                      key={a._id}
                      className={`p-4 rounded-xl border transition-colors ${
                        a.lu ? "bg-slate-50 border-slate-200" : "bg-red-50/50 border-red-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{a.cours?.nom || "Cours inconnu"}</p>
                          <p className="text-sm text-slate-600 mt-1">{a.message}</p>
                          <p className="text-xs text-slate-500 mt-2">{new Date(a.date).toLocaleDateString("fr-FR")}</p>
                        </div>
                        {!a.lu && (
                          <button
                            type="button"
                            onClick={() => handleMarkAlerteLu(a._id)}
                            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded-lg transition-colors flex-shrink-0"
                          >
                            Marquer lue
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!loading && !error && activeNav === "justifications" && (
            <div className="space-y-6">
              {/* Justifier une absence */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow border border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700 text-emerald-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">Justifier une absence</h4>
                </div>
                {presences.filter((p) => p.etat && p.etat !== "present").length === 0 ? (
                    <p className="text-slate-500 text-center py-8 text-sm sm:text-base">Aucune absence à justifier</p>
                  ) : (
                    <div className="space-y-3 sm:space-y-4 max-h-64 sm:max-h-96 overflow-y-auto">
                      {presences
                        .filter((p) => p.etat && p.etat !== "present")
                        .map((p) => {
                          const hasJustification = justifications.some(
                            (j) => j.presence?._id === p._id
                          );
                          return (
                            <div
                              key={p._id}
                              className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-50 to-purple-50 border border-purple-200"
                            >
                              <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                                <p className="font-semibold text-slate-800 text-sm sm:text-base flex-1 min-w-0 truncate">
                                  {p.cours?.nom || "Cours inconnu"}
                                </p>
                                <span
                                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                                    p.etat === "absent"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-orange-100 text-orange-700"
                                  }`}
                                >
                                  {p.etat?.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-slate-500 mb-3">
                                {new Date(p.date).toLocaleDateString("fr-FR")}
                              </p>

                              {hasJustification ? (
                                <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
                                  <p className="text-xs sm:text-sm text-emerald-700 font-medium">
                                    Justification déjà envoyée
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <textarea
                                    placeholder="Expliquez votre absence..."
                                    value={justificationTexts[p._id] || ""}
                                    onChange={(e) =>
                                      setJustificationTexts((prev) => ({
                                        ...prev,
                                        [p._id]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-slate-800 focus:ring-2 focus:ring-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none resize-none text-sm"
                                    rows={3}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSendJustification(p._id)}
                                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors text-sm"
                                  >
                                    <Send className="w-4 h-4" />
                                    Envoyer justification
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Mes justifications (liste) */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow border border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-700 text-emerald-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">Mes justifications</h4>
                  </div>
                  {justifications.length === 0 ? (
                    <p className="text-slate-500 text-center py-8 text-sm">Aucune justification envoyée</p>
                  ) : (
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {justifications.map((j) => (
                        <div
                          key={j._id}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <p className="font-semibold text-slate-800 flex-1 min-w-0 truncate">
                              {j.presence?.cours?.nom || "Cours inconnu"}
                            </p>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                                j.statut === "ACCEPTE"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : j.statut === "REFUSE"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {j.statut?.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 mb-2 line-clamp-2">{j.motif}</p>
                          <p className="text-xs text-slate-500">{new Date(j.date).toLocaleDateString("fr-FR")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
          )}
        </div>
      </main>
    </div>
  );
}
