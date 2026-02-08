import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useError } from "../../context/ErrorContext";
import { api } from "../../services/api";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  CheckSquare,
  FileText,
  AlertCircle,
  LogOut,
  Calendar,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

// 🎓 Dashboard Professeur : vue centrée sur ses cours/élèves
const DashboardProf = () => {
  const { user, token, logout } = useAuth();
  const { showError, showSuccess } = useError();
  const navigate = useNavigate();

  const [cours, setCours] = useState([]);
  const [presences, setPresences] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeNav, setActiveNav] = useState("dashboard");

  // Filtres pour affichage des présences
  const [filterPresenceCours, setFilterPresenceCours] = useState("");
  const [filterPresenceDate, setFilterPresenceDate] = useState("");

  // États pour le système d'appel
  const [selectedCours, setSelectedCours] = useState("");
  const [dateAppel, setDateAppel] = useState(new Date().toISOString().split("T")[0]);
  const [elevesCours, setElevesCours] = useState([]);
  const [appelPresences, setAppelPresences] = useState({}); // { eleveId: "present|absent|retard" }
  const [loadingEleves, setLoadingEleves] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [updatingPresenceId, setUpdatingPresenceId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      setError("");

      try {
        const [coursData, presencesData, justifsData, alertesData] =
          await Promise.all([
            api.get("/cours", token),
            api.get("/presences", token),
            api.get("/justifications", token),
            api.get("/alertes/prof", token),
          ]);

        const mesCours = coursData.filter(
          (c) => c.professeur && c.professeur._id === user._id
        );

        const presencesCoursProf = presencesData.filter(
          (p) => p.cours?.professeur && p.cours.professeur._id === user._id
        );

        const justifsCoursProf = justifsData.filter(
          (j) =>
            j.presence?.cours?.professeur &&
            j.presence.cours.professeur._id === user._id
        );

        setCours(mesCours);
        setPresences(presencesCoursProf);
        setJustifications(justifsCoursProf);
        setAlertes(alertesData);
      } catch (err) {
        console.error(err);
        setError(err.message || "Erreur lors du chargement des données.");
        showError(err.message || "Erreur lors du chargement des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, user]);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleUpdateJustificationStatus = async (id, statut) => {
    try {
      await api.put(`/justifications/${id}`, { statut }, token);
      const justifsData = await api.get("/justifications", token);
      // On re-filtre après mise à jour pour ne garder que les justifs du prof
      const justifsCoursProf = justifsData.filter(
        (j) =>
          j.presence?.cours?.professeur &&
          j.presence.cours.professeur._id === user._id
      );
      setJustifications(justifsCoursProf);
    } catch (err) {
      console.error(err);
      showError(err.message || "Erreur lors de la mise à jour de la justification.");
    }
  };

  // 🔔 Charger les étudiants d'un cours sélectionné
  const handleCoursChange = async (coursId) => {
    setSelectedCours(coursId);
    if (!coursId) {
      setElevesCours([]);
      setAppelPresences({});
      return;
    }

    setLoadingEleves(true);
    try {
      const data = await api.get(`/cours/${coursId}/eleves`, token);
      setElevesCours(data.eleves || []);
      // Initialiser tous les étudiants comme "absent" par défaut
      const initialPresences = {};
      data.eleves.forEach(e => {
        initialPresences[e._id] = "absent";
      });
      setAppelPresences(initialPresences);
    } catch (err) {
      console.error(err);
      showError(err.message || "Erreur lors du chargement des étudiants.");
    } finally {
      setLoadingEleves(false);
    }
  };

  // 🔔 Changer le statut d'un étudiant dans l'appel
  const handleChangePresence = (eleveId, etat) => {
    setAppelPresences(prev => ({
      ...prev,
      [eleveId]: etat,
    }));
  };

  // 🔔 Modifier une présence déjà enregistrée (correction après erreur)
  const handleUpdatePresence = async (presenceId, nouvelEtat) => {
    setUpdatingPresenceId(presenceId);
    try {
      await api.patch(`/presences/${presenceId}`, { etat: nouvelEtat }, token);
      const presencesData = await api.get("/presences", token);
      const presencesCoursProf = presencesData.filter(
        (p) => p.cours?.professeur && p.cours.professeur._id === user._id
      );
      setPresences(presencesCoursProf);
    } catch (err) {
      console.error(err);
      showError(err.message || "Erreur lors de la modification de la présence.");
    } finally {
      setUpdatingPresenceId(null);
    }
  };

  // 🔔 Valider l'appel (créer toutes les présences)
  const handleValiderAppel = async () => {
    if (!selectedCours || !dateAppel) {
      showError("Veuillez sélectionner un cours et une date.");
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (dateAppel !== todayStr) {
      showError("Vous ne pouvez pas modifier les présences pour une date passée.");
      return;
    }

    if (elevesCours.length === 0) {
      showError("Aucun étudiant dans ce cours.");
      return;
    }

    try {
      const presencesArray = elevesCours.map(e => ({
        eleve: e._id,
        etat: appelPresences[e._id] || "absent",
      }));

      const result = await api.post(
        "/presences/appel",
        {
          cours: selectedCours,
          date: dateAppel,
          presences: presencesArray,
        },
        token
      );

      showSuccess(`Appel enregistré. ${result.presences?.length || 0} présence(s), ${result.alertesCreees || 0} alerte(s) envoyée(s).`);

      // Réinitialiser
      setSelectedCours("");
      setElevesCours([]);
      setAppelPresences({});
      
      // Recharger les données
      const presencesData = await api.get("/presences", token);
      const presencesCoursProf = presencesData.filter(
        (p) => p.cours?.professeur && p.cours.professeur._id === user._id
      );
      setPresences(presencesCoursProf);
    } catch (err) {
      console.error(err);
      showError(err.message || "Erreur lors de l'enregistrement de l'appel.");
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { id: "cours", label: "Mes cours", icon: BookOpen },
    { id: "appel", label: "Faire l'appel", icon: ClipboardCheck },
    { id: "presences", label: "Présences", icon: CheckSquare },
    { id: "justifications", label: "Justifications", icon: FileText },
    { id: "alertes", label: "Alertes", icon: AlertCircle },
  ];

  const presencesFiltrees = presences.filter((p) => {
    const okCours = !filterPresenceCours || (p.cours && p.cours._id === filterPresenceCours);
    const okDate =
      !filterPresenceDate ||
      (p.date && new Date(p.date).toISOString().split("T")[0] === filterPresenceDate);
    return okCours && okDate;
  });

  const presencesParCours = presencesFiltrees.reduce((acc, p) => {
    const coursId = p.cours?._id || "aucun";
    if (!acc[coursId]) {
      acc[coursId] = {
        cours: p.cours || null,
        items: [],
      };
    }
    acc[coursId].items.push(p);
    return acc;
  }, {});

  const titleByNav = {
    dashboard: "Tableau de bord",
    cours: "Mes cours",
    appel: "Faire l'appel",
    presences: "Présences",
    justifications: "Justifications",
    alertes: "Alertes",
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
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
                <p className="text-xs text-slate-400 mt-0.5">Espace Professeur</p>
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
                <p className="text-xs text-slate-400 truncate">Professeur</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
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

      {/* ===== CONTENU ===== */}
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
              {titleByNav[activeNav] || "Dashboard Professeur"}
            </h1>
            <p className="text-sm text-slate-500 truncate">
              Bienvenue, {user?.prenom} {user?.nom}
            </p>
          </div>
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

          <div className="mt-4">
          {activeNav === "dashboard" && (
            <div>
              {/* Cartes statistiques */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '24px',
                  marginBottom: '48px',
                }}
              >
                {/* Carte Mes cours */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '28px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <BookOpen size={24} color="#3b82f6" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#64748b', fontWeight: 500 }}>
                      Mes cours
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                    {cours.length}
                  </p>
                </div>

                {/* Carte Présences */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '28px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: '#d1fae5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckSquare size={24} color="#10b981" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#64748b', fontWeight: 500 }}>
                      Présences dans mes cours
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                    {presences.length}
                  </p>
                </div>

                {/* Carte Justifications */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '28px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: '#ddd6fe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileText size={24} color="#8b5cf6" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#64748b', fontWeight: 500 }}>
                      Justifications
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                    {justifications.length}
                  </p>
                </div>

                {/* Carte Alertes */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '28px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        backgroundColor: '#fed7aa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AlertCircle size={24} color="#f97316" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#64748b', fontWeight: 500 }}>
                      Alertes sur mes cours
                    </h3>
                  </div>
                  <p style={{ margin: 0, fontSize: '36px', fontWeight: 700, color: '#1e293b' }}>
                    {alertes.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeNav === "cours" && (
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              >
                Mes cours ({cours.length})
              </h3>
              {cours.length === 0 ? (
                <p style={{ color: '#64748b' }}>Aucun cours trouvé.</p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {cours.map((c) => (
                    <li
                      key={c._id}
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <strong style={{ color: '#1e293b', fontSize: '15px' }}>{c.nom}</strong>
                      <span style={{ color: '#64748b', fontSize: '14px' }}> — Classe: {c.classe?.nom || "N/A"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeNav === "appel" && (
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
                maxWidth: '900px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              >
                Faire l'appel
              </h3>
              
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 8,
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#475569',
                  }}
                >
                  Sélectionner un cours :
                </label>
                <select
                  value={selectedCours}
                  onChange={(e) => handleCoursChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '15px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <option value="">-- Choisir un cours --</option>
                  {cours.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.nom} — {c.classe?.nom || "N/A"}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCours && (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: 8,
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#475569',
                      }}
                    >
                      Date de l'appel :
                    </label>
                    <input
                      type="date"
                      value={dateAppel}
                      onChange={(e) => setDateAppel(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      max={new Date().toISOString().split("T")[0]}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '15px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        backgroundColor: '#ffffff',
                        color: '#1e293b',
                        transition: 'border-color 0.15s ease',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                        e.currentTarget.style.outline = 'none';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    />
                  </div>

                  {loadingEleves ? (
                    <p style={{ color: '#64748b' }}>Chargement des étudiants...</p>
                  ) : elevesCours.length === 0 ? (
                    <p style={{ color: '#64748b' }}>Aucun étudiant dans ce cours.</p>
                  ) : (
                    <>
                      <h4
                        style={{
                          margin: '0 0 16px 0',
                          fontSize: '16px',
                          fontWeight: 600,
                          color: '#1e293b',
                        }}
                      >
                        Liste des étudiants ({elevesCours.length})
                      </h4>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                              <th
                                style={{
                                  padding: '12px 16px',
                                  textAlign: 'left',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#64748b',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                Nom
                              </th>
                              <th
                                style={{
                                  padding: '12px 16px',
                                  textAlign: 'left',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#64748b',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                Prénom
                              </th>
                              <th
                                style={{
                                  padding: '12px 16px',
                                  textAlign: 'left',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#64748b',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                Classe
                              </th>
                              <th
                                style={{
                                  padding: '12px 16px',
                                  textAlign: 'center',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#64748b',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                Statut
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {elevesCours.map((e) => (
                              <tr
                                key={e._id}
                                style={{
                                  borderBottom: '1px solid #f1f5f9',
                                  transition: 'background-color 0.15s ease',
                                }}
                                onMouseEnter={(ev) => {
                                  ev.currentTarget.style.backgroundColor = '#f8fafc';
                                }}
                                onMouseLeave={(ev) => {
                                  ev.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <td style={{ padding: '16px', fontSize: '15px', color: '#1e293b' }}>{e.nom}</td>
                                <td style={{ padding: '16px', fontSize: '15px', color: '#475569' }}>{e.prenom}</td>
                                <td style={{ padding: '16px', fontSize: '15px', color: '#475569' }}>{e.classe || "N/A"}</td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <button
                                      onClick={() => handleChangePresence(e._id, "present")}
                                      style={{
                                        padding: '6px 16px',
                                        backgroundColor: appelPresences[e._id] === "present" ? '#10b981' : '#f1f5f9',
                                        color: appelPresences[e._id] === "present" ? '#ffffff' : '#64748b',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                      }}
                                      onMouseEnter={(ev) => {
                                        if (appelPresences[e._id] !== "present") {
                                          ev.currentTarget.style.backgroundColor = '#e2e8f0';
                                        }
                                      }}
                                      onMouseLeave={(ev) => {
                                        if (appelPresences[e._id] !== "present") {
                                          ev.currentTarget.style.backgroundColor = '#f1f5f9';
                                        }
                                      }}
                                    >
                                      Présent
                                    </button>
                                    <button
                                      onClick={() => handleChangePresence(e._id, "absent")}
                                      style={{
                                        padding: '6px 16px',
                                        backgroundColor: appelPresences[e._id] === "absent" ? '#ef4444' : '#f1f5f9',
                                        color: appelPresences[e._id] === "absent" ? '#ffffff' : '#64748b',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                      }}
                                      onMouseEnter={(ev) => {
                                        if (appelPresences[e._id] !== "absent") {
                                          ev.currentTarget.style.backgroundColor = '#e2e8f0';
                                        }
                                      }}
                                      onMouseLeave={(ev) => {
                                        if (appelPresences[e._id] !== "absent") {
                                          ev.currentTarget.style.backgroundColor = '#f1f5f9';
                                        }
                                      }}
                                    >
                                      Absent
                                    </button>
                                    <button
                                      onClick={() => handleChangePresence(e._id, "retard")}
                                      style={{
                                        padding: '6px 16px',
                                        backgroundColor: appelPresences[e._id] === "retard" ? '#f59e0b' : '#f1f5f9',
                                        color: appelPresences[e._id] === "retard" ? '#ffffff' : '#64748b',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                      }}
                                      onMouseEnter={(ev) => {
                                        if (appelPresences[e._id] !== "retard") {
                                          ev.currentTarget.style.backgroundColor = '#e2e8f0';
                                        }
                                      }}
                                      onMouseLeave={(ev) => {
                                        if (appelPresences[e._id] !== "retard") {
                                          ev.currentTarget.style.backgroundColor = '#f1f5f9';
                                        }
                                      }}
                                    >
                                      Retard
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={handleValiderAppel}
                        style={{
                          marginTop: 24,
                          padding: '14px 28px',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '15px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                          boxShadow: '0 1px 3px rgba(59, 130, 246, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#2563eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#3b82f6';
                        }}
                      >
                        ✅ Valider l'appel
                      </button>
                    </>
                  )}
                </>
              )}
            </section>
          )}

          {activeNav === "presences" && (
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              >
                Présences dans mes cours ({presences.length})
              </h3>

              {/* Filtres */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#475569',
                    }}
                  >
                    Cours
                  </label>
                  <select
                    value={filterPresenceCours}
                    onChange={(e) => setFilterPresenceCours(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      color: '#1e293b',
                    }}
                  >
                    <option value="">Tous</option>
                    {cours.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.nom}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 6,
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#475569',
                    }}
                  >
                    Date
                  </label>
                  <input
                    type="date"
                    value={filterPresenceDate}
                    onChange={(e) => setFilterPresenceDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      fontSize: '14px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      backgroundColor: '#f8fafc',
                      color: '#1e293b',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <p style={{ fontSize: '12px', color: '#475569' }}>
                    Vous pouvez corriger une présence en cliquant sur Présent, Absent ou Retard.
                  </p>
                </div>
              </div>

              {presences.length === 0 ? (
                <p style={{ color: '#64748b' }}>Aucune présence trouvée.</p>
              ) : Object.values(presencesParCours).length === 0 ? (
                <p style={{ color: '#64748b' }}>Aucune présence pour ces filtres.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {Object.values(presencesParCours).map((group) => (
                    <div
                      key={group.cours?._id || 'aucun'}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #e2e8f0',
                          backgroundColor: '#e5e7eb',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
                            {group.cours?.nom || 'Cours inconnu'}
                          </p>
                          <p style={{ margin: 0, fontSize: 13, color: '#4b5563' }}>
                            Prof : {user?.prenom} {user?.nom}
                          </p>
                        </div>
                        {filterPresenceDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4b5563' }}>
                            <Calendar size={14} />
                            <span>{filterPresenceDate}</span>
                          </div>
                        )}
                      </div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f3f4f6' }}>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Élève</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Date</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Statut</th>
                              <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#6b7280', textTransform: 'uppercase' }}>Modifier</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.items.map((p) => (
                              <tr key={p._id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                <td style={{ padding: '10px 14px', fontSize: 14, color: '#111827' }}>
                                  {p.eleve?.prenom} {p.eleve?.nom}
                                </td>
                                <td style={{ padding: '10px 14px', fontSize: 14, color: '#4b5563' }}>
                                  {p.date &&
                                    new Date(p.date).toLocaleDateString('fr-FR', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit',
                                    })}
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <span
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: '999px',
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      backgroundColor:
                                        p.etat === 'present' ? '#d1fae5' :
                                        p.etat === 'absent' ? '#fee2e2' :
                                        '#fed7aa',
                                      color:
                                        p.etat === 'present' ? '#10b981' :
                                        p.etat === 'absent' ? '#ef4444' :
                                        '#f97316',
                                    }}
                                  >
                                    {p.etat.toUpperCase()}
                                  </span>
                                </td>
                                <td style={{ padding: '10px 14px' }}>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {['present', 'absent', 'retard'].map((etat) => {
                                      const isCurrent = p.etat === etat;
                                      const isUpdating = updatingPresenceId === p._id;
                                      const colors = {
                                        present: { bg: '#10b981', hover: '#059669' },
                                        absent: { bg: '#ef4444', hover: '#dc2626' },
                                        retard: { bg: '#f59e0b', hover: '#d97706' },
                                      };
                                      return (
                                        <button
                                          key={etat}
                                          type="button"
                                          disabled={isUpdating}
                                          onClick={() => handleUpdatePresence(p._id, etat)}
                                          style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            border: 'none',
                                            cursor: isUpdating ? 'wait' : 'pointer',
                                            backgroundColor: isCurrent ? colors[etat].bg : '#f1f5f9',
                                            color: isCurrent ? '#fff' : '#64748b',
                                            opacity: isUpdating ? 0.7 : 1,
                                          }}
                                        >
                                          {etat === 'present' ? 'Présent' : etat === 'absent' ? 'Absent' : 'Retard'}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeNav === "justifications" && (
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              >
                Justifications ({justifications.length})
              </h3>
              {justifications.length === 0 ? (
                <p style={{ color: '#64748b' }}>Aucune justification trouvée.</p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {justifications.map((j) => (
                    <li
                      key={j._id}
                      style={{
                        padding: '20px',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ color: '#1e293b', fontSize: '15px', fontWeight: 500 }}>
                          {j.presence?.eleve?.prenom} {j.presence?.eleve?.nom}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '14px' }}> — {j.motif}</span>
                        <span
                          style={{
                            marginLeft: '12px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 500,
                            backgroundColor:
                              j.statut === 'ACCEPTE' ? '#d1fae5' :
                              j.statut === 'REFUSE' ? '#fee2e2' :
                              '#fef3c7',
                            color:
                              j.statut === 'ACCEPTE' ? '#10b981' :
                              j.statut === 'REFUSE' ? '#ef4444' :
                              '#f59e0b',
                          }}
                        >
                          {j.statut}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                          onClick={() => handleUpdateJustificationStatus(j._id, "ACCEPTE")}
                          style={{
                            padding: '8px 20px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#10b981';
                          }}
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() => handleUpdateJustificationStatus(j._id, "REFUSE")}
                          style={{
                            padding: '8px 20px',
                            backgroundColor: '#ef4444',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                          }}
                        >
                          Refuser
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {activeNav === "alertes" && (
            <section
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '32px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0',
              }}
            >
              <h3
                style={{
                  margin: '0 0 24px 0',
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#1e293b',
                }}
              >
                Alertes ({alertes.length})
              </h3>
              {alertes.length === 0 ? (
                <p style={{ color: '#64748b' }}>Aucune alerte trouvée.</p>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                  {alertes.map((a) => (
                    <li
                      key={a._id}
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span style={{ color: '#1e293b', fontSize: '15px' }}>
                        {a.cours?.nom ? `${a.cours.nom} — ` : ''}{a.message}
                      </span>
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: a.lu ? '#e2e8f0' : '#fed7aa',
                          color: a.lu ? '#64748b' : '#f97316',
                        }}
                      >
                        {a.lu ? "Lue" : "Non lue"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardProf;
