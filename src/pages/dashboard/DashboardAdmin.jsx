import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useError } from "../../context/ErrorContext";
import { api } from "../../services/api";

import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardCheck,
  FileText,
  Bell,
  BarChart3,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Menu,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Filter,
  TrendingUp,
  UserCheck,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  Search,
  KeyRound,
  UserX,
} from "lucide-react";

// 🛠 Dashboard Admin : vue globale sur les données principales
const DashboardAdmin = () => {
  const { user, token, logout } = useAuth();
  const { showError, showSuccess } = useError();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [cours, setCours] = useState([]);
  const [presences, setPresences] = useState([]);
  const [justifications, setJustifications] = useState([]);
  const [alertes, setAlertes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isFirstDashboardView = useRef(true);

  // Filtres pour les présences
  const [filterPresenceCours, setFilterPresenceCours] = useState("");
  const [filterPresenceDate, setFilterPresenceDate] = useState("");

  // Filtre pour les utilisateurs (profs / élèves)
  const [usersView, setUsersView] = useState("PROF");

  // Filtre justifications : par date d'absence (jour concerné)
  const [filterJustifDate, setFilterJustifDate] = useState("");

  // Filtres pour les statistiques
  const [filterClasse, setFilterClasse] = useState("");
  const [filterCours, setFilterCours] = useState("");
  const [filterDebut, setFilterDebut] = useState("");
  const [filterFin, setFilterFin] = useState("");

  // CRUD modals
  const [userModal, setUserModal] = useState({ open: false, user: null });
  const [classeModal, setClasseModal] = useState({ open: false, classe: null });
  const [coursModal, setCoursModal] = useState({ open: false, cours: null });
  const [userForm, setUserForm] = useState({ nom: "", prenom: "", email: "", password: "", role: "PROF", classe: "" });
  const [classeForm, setClasseForm] = useState({ nom: "", description: "" });
  const [coursForm, setCoursForm] = useState({ nom: "", professeur: "", classe: "", description: "" });
  const [crudLoading, setCrudLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ type: null, id: null, name: "" });

  // Convocation admin → professeur
  const [convocationProf, setConvocationProf] = useState("");
  const [convocationCours, setConvocationCours] = useState("");
  const [convocationMessage, setConvocationMessage] = useState("");
  const [convocationSending, setConvocationSending] = useState(false);

  const [validantPresences, setValidantPresences] = useState(false);

  // Recherche utilisateur + modal réinit mot de passe
  const [searchUser, setSearchUser] = useState("");
  const [resetPasswordModal, setResetPasswordModal] = useState({ open: false, user: null });
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState("");

  // Justification : modal accepter/refuser avec commentaire ou modifier commentaire
  const [justificationModal, setJustificationModal] = useState({ open: false, justification: null, action: null });
  const [justificationCommentInput, setJustificationCommentInput] = useState("");
  const [userFormErrors, setUserFormErrors] = useState({});

  const refetchData = async () => {
    if (!token) return;
    try {
      const [
        usersData,
        classesData,
        coursData,
        presencesData,
        justifsData,
        alertesData,
      ] = await Promise.all([
        api.get("/users", token),
        api.get("/classes", token),
        api.get("/cours", token),
        api.get("/presences", token),
        api.get("/justifications", token),
        api.get("/alertes", token),
      ]);
      setUsers(usersData);
      setClasses(classesData);
      setCours(coursData);
      setPresences(presencesData);
      setJustifications(justifsData);
      setAlertes(alertesData);
    } catch (err) {
      console.error(err);
      showError(err.message || "Erreur lors du rechargement.");
    }
  };

  const openUserModal = (user = null) => {
    if (user) {
      setUserForm({
        nom: user.nom || "",
        prenom: user.prenom || "",
        email: user.email || "",
        password: "",
        role: user.role || "PROF",
        classe: user.classe?._id || user.classe || "",
      });
    } else {
      setUserForm({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        role: usersView,
        classe: "",
      });
    }
    setUserFormErrors({});
    setUserModal({ open: true, user });
  };

  const validateUserForm = () => {
    const err = {};
    if (!userForm.nom.trim()) err.nom = "Le nom est requis.";
    if (!userForm.prenom.trim()) err.prenom = "Le prénom est requis.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userForm.email.trim()) err.email = "L'email est requis.";
    else if (!emailRegex.test(userForm.email.trim())) err.email = "Format d'email invalide.";
    if (!userModal.user) {
      if (!userForm.password) err.password = "Le mot de passe est requis.";
      else if (userForm.password.length < 3) err.password = "Au moins 3 caractères.";
    }
    setUserFormErrors(err);
    return Object.keys(err).length === 0;
  };

  const submitUser = async (e) => {
    e.preventDefault();
    setUserFormErrors({});
    if (!validateUserForm()) return;
    setCrudLoading(true);
    try {
      const body = {
        nom: userForm.nom.trim(),
        prenom: userForm.prenom.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
      };
      if (userForm.password) body.password = userForm.password;
      if (userForm.role === "ELEVE" && userForm.classe) body.classe = userForm.classe;
      if (userModal.user) {
        await api.put(`/users/${userModal.user._id}`, body, token);
      } else {
        await api.post("/users", body, token);
      }
      await refetchData();
      setUserModal({ open: false, user: null });
      showSuccess(userModal.user ? "Utilisateur mis à jour." : "Utilisateur ajouté.");
    } catch (err) {
      showError(err.message || "Erreur");
    } finally {
      setCrudLoading(false);
    }
  };

  const openClasseModal = (classe = null) => {
    if (classe) {
      setClasseForm({ nom: classe.nom || "", description: classe.description || "" });
    } else {
      setClasseForm({ nom: "", description: "" });
    }
    setClasseModal({ open: true, classe });
  };

  const submitClasse = async (e) => {
    e.preventDefault();
    setCrudLoading(true);
    try {
      const body = { nom: classeForm.nom.trim(), description: classeForm.description.trim() };
      if (classeModal.classe) {
        await api.put(`/classes/${classeModal.classe._id}`, body, token);
      } else {
        await api.post("/classes", body, token);
      }
      await refetchData();
      setClasseModal({ open: false, classe: null });
      showSuccess(classeModal.classe ? "Classe mise à jour." : "Classe ajoutée.");
    } catch (err) {
      showError(err.message || "Erreur");
    } finally {
      setCrudLoading(false);
    }
  };

  const openCoursModal = (cours = null) => {
    if (cours) {
      setCoursForm({
        nom: cours.nom || "",
        professeur: cours.professeur?._id || cours.professeur || "",
        classe: cours.classe?._id || cours.classe || "",
        description: cours.description || "",
      });
    } else {
      setCoursForm({ nom: "", professeur: "", classe: "", description: "" });
    }
    setCoursModal({ open: true, cours });
  };

  const submitCours = async (e) => {
    e.preventDefault();
    setCrudLoading(true);
    try {
      const body = {
        nom: coursForm.nom.trim(),
        professeur: coursForm.professeur || undefined,
        classe: coursForm.classe || undefined,
        description: coursForm.description.trim(),
      };
      if (coursModal.cours) {
        await api.put(`/cours/${coursModal.cours._id}`, body, token);
      } else {
        await api.post("/cours", body, token);
      }
      await refetchData();
      setCoursModal({ open: false, cours: null });
    } catch (err) {
      alert(err.message || "Erreur");
    } finally {
      setCrudLoading(false);
    }
  };

  const confirmDelete = (type, id, name) => setDeleteConfirm({ type, id, name });
  const cancelDelete = () => setDeleteConfirm({ type: null, id: null, name: "" });

  const doDelete = async () => {
    const { type, id } = deleteConfirm;
    if (!type || !id) return;
    setCrudLoading(true);
    try {
      if (type === "user") await api.delete(`/users/${id}`, token);
      else if (type === "classe") await api.delete(`/classes/${id}`, token);
      else if (type === "cours") await api.delete(`/cours/${id}`, token);
      await refetchData();
      cancelDelete();
      showSuccess("Élément supprimé.");
    } catch (err) {
      showError(err.message || "Erreur");
    } finally {
      setCrudLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      setError("");

      try {
        const [
          usersData,
          classesData,
          coursData,
          presencesData,
          justifsData,
          alertesData,
        ] = await Promise.all([
          api.get("/users", token),
          api.get("/classes", token),
          api.get("/cours", token),
          api.get("/presences", token),
          api.get("/justifications", token),
          api.get("/alertes", token),
        ]);

        setUsers(usersData);
        setClasses(classesData);
        setCours(coursData);
        setPresences(presencesData);
        setJustifications(justifsData);
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
  }, [token]);

  // 🔐 Déconnexion admin
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openJustificationModal = (j, action) => {
    setJustificationModal({ open: true, justification: j, action });
    setJustificationCommentInput(j?.commentaireAdmin || "");
  };

  const submitJustificationModal = async () => {
    const { justification, action } = justificationModal;
    if (!justification) return;
    try {
      if (action === "accept" || action === "refuse") {
        const statut = action === "accept" ? "ACCEPTE" : "REFUSE";
        await api.put(`/justifications/${justification._id}`, { statut, commentaireAdmin: justificationCommentInput.trim() || undefined }, token);
      } else if (action === "comment") {
        await api.patch(`/justifications/${justification._id}/commentaire`, { commentaireAdmin: justificationCommentInput.trim() }, token);
      }
      const justifsData = await api.get("/justifications", token);
      setJustifications(justifsData);
      setJustificationModal({ open: false, justification: null, action: null });
      setJustificationCommentInput("");
    } catch (err) {
      alert(err.message || "Erreur.");
    }
  };

  // 📊 Charger les statistiques avec filtres
  const loadStatistics = async () => {
    try {
      const params = new URLSearchParams();
      if (filterClasse) params.append("classe", filterClasse);
      if (filterCours) params.append("cours", filterCours);
      if (filterDebut) params.append("debut", filterDebut);
      if (filterFin) params.append("fin", filterFin);

      const statsData = await api.get(`/statistics?${params.toString()}`, token);
      setStatistics(statsData);
    } catch (err) {
      console.error(err);
      showError(err.message || "Erreur lors du chargement des statistiques.");
    }
  };

  // Charger les statistiques quand on change de filtre ou qu'on ouvre l'onglet
  useEffect(() => {
    if (activeNav === "statistics" && token) {
      loadStatistics();
    }
  }, [activeNav, filterClasse, filterCours, filterDebut, filterFin, token]);

  // Rafraîchir les données (chiffres Vue d'ensemble) quand on revient sur le tableau de bord
  useEffect(() => {
    if (activeNav === "dashboard" && token) {
      if (isFirstDashboardView.current) {
        isFirstDashboardView.current = false;
      } else {
        refetchData();
      }
    }
  }, [activeNav, token]);

  // Rafraîchir périodiquement les chiffres (présences du jour, alertes, justifications) sur la Vue d'ensemble
  useEffect(() => {
    if (activeNav !== "dashboard" || !token) return;
    const interval = setInterval(() => {
      refetchData();
    }, 45000); // toutes les 45 secondes
    return () => clearInterval(interval);
  }, [activeNav, token]);

  // Calculer les statistiques rapides
  const totalEleves = users.filter((u) => u.role === "ELEVE").length;
  const totalProfs = users.filter((u) => u.role === "PROF").length;
  const justifEnAttente = justifications.filter((j) => j.statut === "EN_ATTENTE").length;
  const alertesNonLues = alertes.filter((a) => !a.lu).length;

  // Groupements pour affichage structuré
  const usersEleves = users.filter((u) => u.role === "ELEVE");
  const usersProfs = users.filter((u) => u.role === "PROF");

  const filterBySearch = (list) => {
    if (!searchUser.trim()) return list;
    const term = searchUser.trim().toLowerCase();
    return list.filter(
      (u) =>
        (u.nom || "").toLowerCase().includes(term) ||
        (u.prenom || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term)
    );
  };
  const usersProfsFiltered = filterBySearch(usersProfs);
  const usersElevesFiltered = filterBySearch(usersEleves);

  // Filtres et groupements pour alertes
  const [filterAlerteCours, setFilterAlerteCours] = useState("");
  const [filterAlerteProf, setFilterAlerteProf] = useState("");

  const alertesFiltrees = alertes.filter((a) => {
    const okCours =
      !filterAlerteCours || (a.cours && a.cours._id === filterAlerteCours);
    const okProf =
      !filterAlerteProf ||
      (a.cours &&
        a.cours.professeur &&
        a.cours.professeur._id === filterAlerteProf);
    return okCours && okProf;
  });

  const alertesParCours = alertesFiltrees.reduce((acc, a) => {
    const coursId = a.cours?._id || "aucun";
    if (!acc[coursId]) {
      acc[coursId] = {
        cours: a.cours || null,
        items: [],
      };
    }
    acc[coursId].items.push(a);
    return acc;
  }, {});

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

  // Justifications filtrées par date d'absence (jour concerné)
  const justificationsFiltrees = justifications.filter((j) => {
    if (!filterJustifDate) return true;
    const dateAbsence = j.presence?.date;
    if (!dateAbsence) return false;
    const dateStr = new Date(dateAbsence).toISOString().split("T")[0];
    return dateStr === filterJustifDate;
  });

  const justificationsParCours = justificationsFiltrees.reduce((acc, j) => {
    const coursId = j.presence?.cours?._id || "aucun";
    if (!acc[coursId]) {
      acc[coursId] = {
        cours: j.presence?.cours || null,
        items: [],
      };
    }
    acc[coursId].items.push(j);
    return acc;
  }, {});

  const nombrePresencesAffichees =
    filterPresenceCours || filterPresenceDate ? presencesFiltrees.length : presences.length;

  const titleByNav = {
    dashboard: "Vue d'ensemble",
    users: "Utilisateurs",
    classes: "Classes & cours",
    presences: "Présences",
    justifications: "Justifications",
    alertes: "Alertes",
    statistics: "Statistiques",
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ===== MODAL CONFIRMATION SUPPRESSION ===== */}
      {deleteConfirm.type && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <p className="text-slate-800 font-semibold mb-2">Confirmer la suppression</p>
            <p className="text-slate-600 text-sm mb-4">
              Supprimer &quot;{deleteConfirm.name}&quot; ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={doDelete}
                disabled={crudLoading}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {crudLoading ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL RÉINITIALISER MOT DE PASSE ===== */}
      {resetPasswordModal.open && resetPasswordModal.user && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Réinitialiser le mot de passe</h3>
            <p className="text-sm text-slate-600 mb-3">
              {resetPasswordModal.user.prenom} {resetPasswordModal.user.nom}
            </p>
            <input
              type="password"
              value={resetPasswordValue}
              onChange={(e) => setResetPasswordValue(e.target.value)}
              placeholder="Nouveau mot de passe (min. 6 caractères)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 mb-2"
            />
            <input
              type="password"
              value={resetPasswordConfirm}
              onChange={(e) => setResetPasswordConfirm(e.target.value)}
              placeholder="Confirmer le mot de passe"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setResetPasswordModal({ open: false, user: null });
                  setResetPasswordValue("");
                  setResetPasswordConfirm("");
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                disabled={crudLoading || resetPasswordValue.length < 6 || resetPasswordValue !== resetPasswordConfirm}
                onClick={async () => {
                  if (resetPasswordValue !== resetPasswordConfirm) {
                    alert("Les mots de passe ne correspondent pas.");
                    return;
                  }
                  setCrudLoading(true);
                  try {
                    await api.patch(
                      `/users/${resetPasswordModal.user._id}/reset-password`,
                      { newPassword: resetPasswordValue },
                      token
                    );
                    setResetPasswordModal({ open: false, user: null });
                    setResetPasswordValue("");
                    setResetPasswordConfirm("");
                    alert("Mot de passe réinitialisé.");
                  } catch (err) {
                    alert(err.message || "Erreur");
                  } finally {
                    setCrudLoading(false);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                {crudLoading ? "Envoi..." : "Réinitialiser"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL JUSTIFICATION (Accepter / Refuser avec commentaire ou Modifier commentaire) ===== */}
      {justificationModal.open && justificationModal.justification && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {justificationModal.action === "accept"
                ? "Accepter la justification"
                : justificationModal.action === "refuse"
                ? "Refuser la justification"
                : "Commentaire admin"}
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              {justificationModal.justification.eleve?.prenom} {justificationModal.justification.eleve?.nom}
              {" — "}
              {justificationModal.justification.presence?.date
                ? new Date(justificationModal.justification.presence.date).toLocaleDateString("fr-FR")
                : ""}
            </p>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Commentaire (optionnel)
            </label>
            <textarea
              value={justificationCommentInput}
              onChange={(e) => setJustificationCommentInput(e.target.value)}
              placeholder="Votre commentaire pour l'élève..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 mb-4 resize-none"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setJustificationModal({ open: false, justification: null, action: null });
                  setJustificationCommentInput("");
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={submitJustificationModal}
                className={`px-4 py-2 rounded-xl text-white font-medium ${
                  justificationModal.action === "accept"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : justificationModal.action === "refuse"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-slate-600 hover:bg-slate-700"
                }`}
              >
                {justificationModal.action === "accept"
                  ? "Accepter"
                  : justificationModal.action === "refuse"
                  ? "Refuser"
                  : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL UTILISATEUR ===== */}
      {userModal.open && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl my-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {userModal.user ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
            </h3>
            <form onSubmit={submitUser} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom</label>
                <input
                  value={userForm.nom}
                  onChange={(e) => setUserForm((f) => ({ ...f, nom: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-100 ${userFormErrors.nom ? "border-red-500" : "border-slate-300 focus:border-indigo-500"}`}
                />
                {userFormErrors.nom && <p className="text-red-600 text-xs mt-1">{userFormErrors.nom}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Prénom</label>
                <input
                  value={userForm.prenom}
                  onChange={(e) => setUserForm((f) => ({ ...f, prenom: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-100 ${userFormErrors.prenom ? "border-red-500" : "border-slate-300 focus:border-indigo-500"}`}
                />
                {userFormErrors.prenom && <p className="text-red-600 text-xs mt-1">{userFormErrors.prenom}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-100 ${userFormErrors.email ? "border-red-500" : "border-slate-300 focus:border-indigo-500"}`}
                />
                {userFormErrors.email && <p className="text-red-600 text-xs mt-1">{userFormErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Mot de passe {userModal.user && "(laisser vide pour ne pas changer)"}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-100 ${userFormErrors.password ? "border-red-500" : "border-slate-300 focus:border-indigo-500"}`}
                  placeholder={userModal.user ? "••••••••" : ""}
                />
                {userFormErrors.password && <p className="text-red-600 text-xs mt-1">{userFormErrors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Rôle</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="PROF">Professeur</option>
                  <option value="ELEVE">Élève</option>
                </select>
              </div>
              {userForm.role === "ELEVE" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Classe</label>
                  <select
                    value={userForm.classe}
                    onChange={(e) => setUserForm((f) => ({ ...f, classe: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="">— Aucune —</option>
                    {classes.map((cl) => (
                      <option key={cl._id} value={cl._id}>{cl.nom}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserModal({ open: false, user: null })}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={crudLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {crudLoading ? "Enregistrement..." : userModal.user ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL CLASSE ===== */}
      {classeModal.open && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl my-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {classeModal.classe ? "Modifier la classe" : "Ajouter une classe"}
            </h3>
            <form onSubmit={submitClasse} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom</label>
                <input
                  value={classeForm.nom}
                  onChange={(e) => setClasseForm((f) => ({ ...f, nom: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={classeForm.description}
                  onChange={(e) => setClasseForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClasseModal({ open: false, classe: null })}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={crudLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {crudLoading ? "Enregistrement..." : classeModal.classe ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL COURS ===== */}
      {coursModal.open && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl my-4">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {coursModal.cours ? "Modifier le cours" : "Ajouter un cours"}
            </h3>
            <form onSubmit={submitCours} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom du cours</label>
                <input
                  value={coursForm.nom}
                  onChange={(e) => setCoursForm((f) => ({ ...f, nom: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Professeur</label>
                <select
                  value={coursForm.professeur}
                  onChange={(e) => setCoursForm((f) => ({ ...f, professeur: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">— Aucun —</option>
                  {users.filter((u) => u.role === "PROF").map((p) => (
                    <option key={p._id} value={p._id}>{p.prenom} {p.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Classe</label>
                <select
                  value={coursForm.classe}
                  onChange={(e) => setCoursForm((f) => ({ ...f, classe: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">— Aucune —</option>
                  {classes.map((cl) => (
                    <option key={cl._id} value={cl._id}>{cl.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={coursForm.description}
                  onChange={(e) => setCoursForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCoursModal({ open: false, cours: null })}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={crudLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {crudLoading ? "Enregistrement..." : coursModal.cours ? "Enregistrer" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
                <p className="text-xs text-slate-400 mt-0.5">Espace Admin</p>
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
                <p className="text-xs text-slate-400 truncate">Administrateur</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {[
              { id: "dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
              { id: "users", label: "Utilisateurs", icon: Users, badge: users.length },
              { id: "classes", label: "Classes & cours", icon: BookOpen },
              { id: "presences", label: "Présences", icon: ClipboardCheck },
              { id: "justifications", label: "Justifications", icon: FileText, badge: justifEnAttente, badgeAlert: true },
              { id: "alertes", label: "Alertes", icon: Bell, badge: alertesNonLues, badgeRed: true },
              { id: "statistics", label: "Statistiques", icon: BarChart3 },
            ].map((item) => {
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
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${
                      item.badgeRed ? "bg-red-500/80 text-white" : item.badgeAlert ? "bg-amber-500/80 text-white" : "bg-slate-600 text-slate-200"
                    }`}>
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
              {titleByNav[activeNav] || "Dashboard Admin"}
            </h1>
            <p className="text-sm text-slate-500 truncate">
              Bienvenue, {user?.prenom} {user?.nom}
            </p>
          </div>
          {justifEnAttente > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">{justifEnAttente}</span>
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

          {!loading && !error && (
            <>
              {/* ===== VUE D'ENSEMBLE ===== */}
              {activeNav === "dashboard" && (
                <>
                  {/* Statistics Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex-shrink-0">
                          <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-2xl sm:text-3xl font-bold text-slate-800">{users.length}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-slate-600">Utilisateurs</h3>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex-shrink-0">
                          <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-2xl sm:text-3xl font-bold text-slate-800">{totalEleves}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-slate-600">Élèves</h3>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white flex-shrink-0">
                          <UserCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-2xl sm:text-3xl font-bold text-slate-800">{totalProfs}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-slate-600">Professeurs</h3>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex-shrink-0">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-2xl sm:text-3xl font-bold text-slate-800">{classes.length}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-slate-600">Classes</h3>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex-shrink-0">
                          <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-2xl sm:text-3xl font-bold text-slate-800">{cours.length}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-slate-600">Cours</h3>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex-shrink-0">
                          <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-2xl sm:text-3xl font-bold text-slate-800">{presences.length}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-slate-600">Présences</h3>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex-shrink-0">
                          <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-2xl sm:text-3xl font-bold text-slate-800">{justifications.length}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-slate-600">Justifications</h3>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60 hover:shadow-xl transition-shadow duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex-shrink-0">
                          <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <span className="text-2xl sm:text-3xl font-bold text-slate-800">{alertes.length}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-medium text-slate-600">Alertes</h3>
                    </div>
                  </div>
                </>
              )}

              {/* ===== UTILISATEURS ===== */}
              {activeNav === "users" && (
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                      <h4 className="text-base sm:text-lg font-bold text-slate-800">
                        Utilisateurs ({users.length})
                      </h4>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openUserModal()}
                          className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          {usersView === "PROF" ? "Ajouter un prof" : "Ajouter un élève"}
                        </button>
                        <div className="inline-flex items-center rounded-full bg-slate-100 p-1">
                          <button
                            onClick={() => setUsersView("PROF")}
                            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-colors ${
                              usersView === "PROF"
                                ? "bg-blue-600 text-white"
                                : "text-slate-600 hover:text-slate-800"
                            }`}
                          >
                            Profs ({totalProfs})
                          </button>
                          <button
                            onClick={() => setUsersView("ELEVE")}
                            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-colors ${
                              usersView === "ELEVE"
                                ? "bg-emerald-600 text-white"
                                : "text-slate-600 hover:text-slate-800"
                            }`}
                          >
                            Élèves ({totalEleves})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Recherche */}
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Rechercher un utilisateur</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={searchUser}
                          onChange={(e) => setSearchUser(e.target.value)}
                          placeholder="Nom, prénom ou email..."
                          className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-3 max-h-[600px] overflow-y-auto">
                    {(usersView === "PROF" ? usersProfsFiltered : usersElevesFiltered).map((u) => (
                      <div
                        key={u._id}
                        className="flex flex-wrap items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 hover:border-blue-300 transition-all duration-200 gap-2"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white font-semibold text-sm flex-shrink-0">
                            {u.prenom?.[0]}{u.nom?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm sm:text-base truncate">
                              {u.prenom} {u.nom}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : u.role === "PROF"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {u.role}
                        </span>
                        {u.role !== "ADMIN" && (
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                              u.actif !== false ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {u.actif !== false ? "Actif" : "Inactif"}
                          </span>
                        )}
                        <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                          <button
                            onClick={() => openUserModal(u)}
                            className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                            title="Modifier"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          {u.role !== "ADMIN" && (
                            <>
                              <button
                                onClick={() => {
                                  setResetPasswordModal({ open: true, user: u });
                                  setResetPasswordValue("");
                                  setResetPasswordConfirm("");
                                }}
                                className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                                title="Réinitialiser le mot de passe"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.patch(`/users/${u._id}/actif`, { actif: u.actif === false }, token);
                                    await refetchData();
                                    showSuccess(u.actif === false ? "Compte activé." : "Compte désactivé.");
                                  } catch (err) {
                                    showError(err.message || "Erreur");
                                  }
                                }}
                                className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors"
                                title={u.actif !== false ? "Désactiver le compte" : "Activer le compte"}
                              >
                                {u.actif !== false ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => confirmDelete("user", u._id, `${u.prenom} ${u.nom}`)}
                                className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                    {(usersView === "PROF" ? usersProfsFiltered : usersElevesFiltered).length === 0 && (
                      <p className="text-slate-500 text-sm py-4 text-center">
                        {searchUser.trim() ? "Aucun utilisateur ne correspond à la recherche." : "Aucun utilisateur."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ===== CLASSES & COURS ===== */}
              {activeNav === "classes" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {/* Classes */}
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-100 text-orange-600 flex-shrink-0">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-800">
                        Classes ({classes.length})
                      </h4>
                      <button
                        onClick={() => openClasseModal()}
                        className="ml-auto inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter une classe
                      </button>
                    </div>

                    <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                      {classes.map((c) => (
                        <div
                          key={c._id}
                          className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-50 to-orange-50 border border-slate-200 hover:border-orange-300 transition-all duration-200 gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm sm:text-base">
                              {c.nom}
                            </p>
                            {c.description && (
                              <p className="text-xs text-slate-500 mt-0.5 truncate">{c.description}</p>
                            )}
                          </div>
                          <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 flex-shrink-0">
                            {c.eleves?.length || 0} élèves
                          </span>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => openClasseModal(c)}
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete("classe", c._id, c.nom)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cours */}
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 text-indigo-600 flex-shrink-0">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-800">
                        Cours ({cours.length})
                      </h4>
                      <button
                        onClick={() => openCoursModal()}
                        className="ml-auto inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter un cours
                      </button>
                    </div>

                    <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                      {cours.map((c) => (
                        <div
                          key={c._id}
                          className="flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-slate-50 to-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all duration-200 gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm sm:text-base">
                              {c.nom}
                            </p>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                              Classe : {c.classe?.nom || "N/A"}
                              {c.professeur && ` — Prof : ${c.professeur.prenom} ${c.professeur.nom}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => openCoursModal(c)}
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors"
                              title="Modifier"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => confirmDelete("cours", c._id, c.nom)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== PRÉSENCES ===== */}
              {activeNav === "presences" && (
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-cyan-100 text-cyan-600 flex-shrink-0">
                      <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-800">
                      Présences ({nombrePresencesAffichees})
                    </h4>
                  </div>

                  {/* Filtres */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        Cours
                      </label>
                      <select
                        value={filterPresenceCours}
                        onChange={(e) => setFilterPresenceCours(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 bg-slate-50 text-slate-800 text-sm sm:text-base"
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
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={filterPresenceDate}
                        onChange={(e) => setFilterPresenceDate(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 bg-slate-50 text-slate-800 text-sm sm:text-base"
                      />
                    </div>
                    <div className="flex items-end">
                      <p className="text-xs sm:text-sm text-slate-500">
                        Choisissez un cours et une date. Une fois validée, la journée ne peut plus être modifiée.
                      </p>
                    </div>
                  </div>

                  {filterPresenceCours && filterPresenceDate && (() => {
                    const groupForDate = Object.values(presencesParCours).find(
                      (g) => g.cours?._id === filterPresenceCours
                    );
                    const itemsForDate = groupForDate?.items || [];
                    const allValidees = itemsForDate.length > 0 && itemsForDate.every((p) => p.validee);
                    return (
                      <div className="mb-4 flex items-center gap-3">
                        {allValidees ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-semibold">
                            Journée validée — aucune modification possible
                          </span>
                        ) : (
                          <button
                            disabled={validantPresences || itemsForDate.length === 0}
                            onClick={async () => {
                              setValidantPresences(true);
                              try {
                                await api.post("/presences/valider", {
                                  cours: filterPresenceCours,
                                  date: filterPresenceDate,
                                }, token);
                                const presencesData = await api.get("/presences", token);
                                setPresences(presencesData);
                                showSuccess("Présences validées pour cette journée.");
                              } catch (err) {
                                showError(err.message || "Erreur");
                              } finally {
                                setValidantPresences(false);
                              }
                            }}
                            className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-semibold hover:bg-cyan-700 disabled:opacity-50"
                          >
                            {validantPresences ? "Validation..." : "Valider pour la journée"}
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  <div className="space-y-4 sm:space-y-5 max-h-[600px] overflow-y-auto">
                    {Object.values(presencesParCours).map((group) => (
                      <div
                        key={group.cours?._id || "aucun"}
                        className="border border-slate-200 rounded-xl sm:rounded-2xl bg-slate-50"
                      >
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 bg-slate-100/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm sm:text-base">
                              {group.cours?.nom || "Cours inconnu"}
                            </p>
                            {group.cours?.professeur && (
                              <p className="text-xs sm:text-sm text-slate-500">
                                Prof : {group.cours.professeur.prenom} {group.cours.professeur.nom}
                              </p>
                            )}
                          </div>
                          {filterPresenceDate && (
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
                              <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{filterPresenceDate}</span>
                            </div>
                          )}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs sm:text-sm">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Élève
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Date
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Statut
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Validé
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((p) => (
                                <tr
                                  key={p._id}
                                  className="border-t border-slate-100 hover:bg-slate-50/80"
                                >
                                  <td className="px-3 sm:px-4 py-2 text-slate-800">
                                    {p.eleve?.prenom} {p.eleve?.nom}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-slate-600">
                                    {p.date &&
                                      new Date(p.date).toLocaleDateString("fr-FR", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                      })}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2">
                                    <span
                                      className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                                        p.etat === "present"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : p.etat === "absent"
                                          ? "bg-red-100 text-red-700"
                                          : "bg-orange-100 text-orange-700"
                                      }`}
                                    >
                                      {p.etat?.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-4 py-2">
                                    {p.validee ? (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                        Oui
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 text-xs">—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    {Object.values(presencesParCours).length === 0 && (
                      <p className="text-slate-500 text-sm sm:text-base text-center py-6">
                        Aucune présence pour ces filtres.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ===== JUSTIFICATIONS ===== */}
              {activeNav === "justifications" && (
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 text-amber-600 flex-shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-800">
                      Justifications ({justifications.length})
                    </h4>
                    {justifEnAttente > 0 && (
                      <span className="ml-auto bg-amber-500 text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold">
                        {justifEnAttente} en attente
                      </span>
                    )}
                  </div>

                  {/* Filtre par date d'absence (jour concerné) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        <Calendar className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                        Date d'absence concernée
                      </label>
                      <input
                        type="date"
                        value={filterJustifDate}
                        onChange={(e) => setFilterJustifDate(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 bg-slate-50 text-slate-800 text-sm sm:text-base"
                      />
                    </div>
                    <div className="flex items-end">
                      <p className="text-xs sm:text-sm text-slate-500">
                        Chaque bloc correspond à un cours. La colonne « Jour d'absence » indique la date pour laquelle l'élève a justifié son absence.
                      </p>
                    </div>
                  </div>

                  {/* Par cours : un tableau par cours */}
                  <div className="space-y-4 sm:space-y-5 max-h-[600px] overflow-y-auto">
                    {Object.values(justificationsParCours).map((group) => (
                      <div
                        key={group.cours?._id || "aucun"}
                        className="border border-slate-200 rounded-xl sm:rounded-2xl bg-slate-50"
                      >
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 bg-amber-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm sm:text-base">
                              {group.cours?.nom || "Cours inconnu"}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {group.items.length} justification{group.items.length > 1 ? "s" : ""} pour ce cours
                            </p>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs sm:text-sm">
                            <thead className="bg-slate-100">
                              <tr>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Élève
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Jour d'absence
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Motif
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Envoyée le
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Statut
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Commentaire admin
                                </th>
                                <th className="px-3 sm:px-4 py-2 text-left font-semibold text-slate-600">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.items.map((j) => (
                                <tr
                                  key={j._id}
                                  className="border-t border-slate-100 hover:bg-slate-50/80"
                                >
                                  <td className="px-3 sm:px-4 py-2 text-slate-800">
                                    {j.eleve?.prenom} {j.eleve?.nom}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-slate-700 whitespace-nowrap">
                                    {j.presence?.date
                                      ? new Date(j.presence.date).toLocaleDateString("fr-FR", {
                                          weekday: "short",
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "—"}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-slate-600 max-w-[200px] truncate" title={j.motif}>
                                    {j.motif}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-slate-500 text-xs whitespace-nowrap">
                                    {j.date
                                      ? new Date(j.date).toLocaleDateString("fr-FR", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "—"}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2">
                                    <span
                                      className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold ${
                                        j.statut === "EN_ATTENTE"
                                          ? "bg-amber-100 text-amber-700"
                                          : j.statut === "ACCEPTE"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {j.statut}
                                    </span>
                                  </td>
                                  <td className="px-3 sm:px-4 py-2 text-slate-600 max-w-[180px] truncate text-xs" title={j.commentaireAdmin || ""}>
                                    {j.commentaireAdmin || "—"}
                                  </td>
                                  <td className="px-3 sm:px-4 py-2">
                                    {j.statut === "EN_ATTENTE" ? (
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          onClick={() => openJustificationModal(j, "accept")}
                                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                                        >
                                          Accepter
                                        </button>
                                        <button
                                          onClick={() => openJustificationModal(j, "refuse")}
                                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                                        >
                                          Refuser
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-2 items-center">
                                        <button
                                          onClick={() => openJustificationModal(j, "comment")}
                                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                                        >
                                          {j.commentaireAdmin ? "Modifier commentaire" : "Ajouter commentaire"}
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    {Object.values(justificationsParCours).length === 0 && (
                      <p className="text-slate-500 text-sm sm:text-base text-center py-8">
                        {filterJustifDate
                          ? "Aucune justification pour cette date d'absence."
                          : "Aucune justification enregistrée."}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ===== ALERTES ===== */}
              {activeNav === "alertes" && (
                <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-red-100 text-red-600 flex-shrink-0">
                      <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-800">
                      Alertes ({alertes.length})
                    </h4>
                    {alertesNonLues > 0 && (
                      <span className="ml-auto bg-red-500 text-white px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold">
                        {alertesNonLues} non lues
                      </span>
                    )}
                  </div>

                  {/* Filtres alertes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        Cours
                      </label>
                      <select
                        value={filterAlerteCours}
                        onChange={(e) => setFilterAlerteCours(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-slate-50 text-slate-800 text-sm sm:text-base"
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
                      <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                        Professeur
                      </label>
                      <select
                        value={filterAlerteProf}
                        onChange={(e) => setFilterAlerteProf(e.target.value)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border-2 border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 bg-slate-50 text-slate-800 text-sm sm:text-base"
                      >
                        <option value="">Tous</option>
                        {usersProfs.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.prenom} {p.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <p className="text-xs sm:text-sm text-slate-500">
                        Alertes élèves (ex. 3 absences non justifiées).
                      </p>
                    </div>
                  </div>

                  {/* Convoquer un professeur */}
                  <div className="mb-4 sm:mb-6 p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                    <h5 className="text-sm font-bold text-slate-800 mb-3">Convoquer un professeur</h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Cours</label>
                        <select
                          value={convocationCours}
                          onChange={(e) => {
                            const coursId = e.target.value;
                            setConvocationCours(coursId);
                            const selectedCours = cours.find((c) => c._id === coursId);
                            if (selectedCours?.professeur?._id) {
                              setConvocationProf(selectedCours.professeur._id);
                            } else {
                              setConvocationProf("");
                            }
                          }}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                        >
                          <option value="">Choisir un cours</option>
                          {cours.map((c) => (
                            <option key={c._id} value={c._id}>{c.nom}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Professeur (rempli selon le cours)</label>
                        <select
                          value={convocationProf}
                          onChange={(e) => setConvocationProf(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                        >
                          <option value="">Choisir</option>
                          {usersProfs.map((p) => (
                            <option key={p._id} value={p._id}>{p.prenom} {p.nom}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Message de convocation</label>
                      <textarea
                        value={convocationMessage}
                        onChange={(e) => setConvocationMessage(e.target.value)}
                        placeholder="Message à envoyer au professeur..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <button
                      disabled={!convocationProf || !convocationCours || !convocationMessage.trim() || convocationSending}
                      onClick={async () => {
                        setConvocationSending(true);
                        try {
                          await api.post("/alertes/convocation", {
                            prof: convocationProf,
                            cours: convocationCours,
                            message: convocationMessage.trim(),
                          }, token);
                          setConvocationProf("");
                          setConvocationCours("");
                          setConvocationMessage("");
                          showSuccess("Convocation envoyée au professeur.");
                        } catch (err) {
                          showError(err.message || "Erreur");
                        } finally {
                          setConvocationSending(false);
                        }
                      }}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {convocationSending ? "Envoi..." : "Envoyer la convocation"}
                    </button>
                  </div>

                  <div className="space-y-4 sm:space-y-6 max-h-[600px] overflow-y-auto">
                    {/* Alertes par cours */}
                    {Object.values(alertesParCours).map((group) => (
                      <div
                        key={group.cours?._id || "aucun"}
                        className="border border-slate-200 rounded-xl sm:rounded-2xl bg-slate-50"
                      >
                        <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200 bg-red-50/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm sm:text-base">
                              {group.cours?.nom || "Cours inconnu"}
                            </p>
                            {group.cours?.professeur && (
                              <p className="text-xs sm:text-sm text-slate-500">
                                Prof : {group.cours.professeur.prenom} {group.cours.professeur.nom}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {group.items.map((a) => (
                            <div
                              key={a._id}
                              className={`px-3 sm:px-4 py-2.5 sm:py-3 flex items-start justify-between gap-2 sm:gap-3 ${
                                a.lu ? "bg-slate-50" : "bg-gradient-to-r from-red-50 to-rose-50"
                              }`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 text-xs sm:text-sm">
                                  {a.eleve?.prenom} {a.eleve?.nom}
                                </p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                                  {a.message}
                                </p>
                                {a.date && (
                                  <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                                    {new Date(a.date).toLocaleDateString("fr-FR")}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {!a.lu && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await api.patch(`/alertes/${a._id}/lu`, {}, token);
                                        const alertesData = await api.get("/alertes", token);
                                        setAlertes(alertesData);
                                      } catch (err) {
                                        console.error(err);
                                      }
                                    }}
                                    className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-[11px] sm:text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                                  >
                                    Marquer lue
                                  </button>
                                )}
                                {a.lu && (
                                  <span className="px-2 sm:px-3 py-1 text-[11px] sm:text-xs rounded-full bg-slate-100 text-slate-500 font-medium">
                                    Lue
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {Object.values(alertesParCours).length === 0 && (
                      <p className="text-slate-500 text-sm sm:text-base text-center py-6">
                        Aucune alerte.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ===== AVIS SUR LES PROFESSEURS ===== */}
              {/* ===== STATISTIQUES ===== */}
              {activeNav === "statistics" && (
                <div className="space-y-6">
                  {/* Filtres */}
                  <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 text-purple-600 flex-shrink-0">
                        <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-800">Filtres</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Classe :
                        </label>
                        <select
                          value={filterClasse}
                          onChange={(e) => setFilterClasse(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-slate-50 text-slate-800 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                        >
                          <option value="">Toutes les classes</option>
                          {classes.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.nom}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Cours :
                        </label>
                        <select
                          value={filterCours}
                          onChange={(e) => setFilterCours(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-slate-50 text-slate-800 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                        >
                          <option value="">Tous les cours</option>
                          {cours.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.nom}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Date début :
                        </label>
                        <input
                          type="date"
                          value={filterDebut}
                          onChange={(e) => setFilterDebut(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-slate-50 text-slate-800 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Date fin :
                        </label>
                        <input
                          type="date"
                          value={filterFin}
                          onChange={(e) => setFilterFin(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 bg-slate-50 text-slate-800 focus:outline-none transition-all duration-200 text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Résultats statistiques */}
                  {statistics ? (
                    <>
                      {/* Résumé dashboard : totaux + taux absence + élève/classe les plus absents */}
                      {statistics.dashboard && (
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 text-purple-600 flex-shrink-0">
                              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-800">Résumé du dashboard</h4>
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                            <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                              <p className="text-xs sm:text-sm text-slate-600 mb-1">Élèves</p>
                              <p className="text-xl sm:text-2xl font-bold text-slate-800">{statistics.dashboard.totalEleves}</p>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl bg-blue-50 border border-blue-200">
                              <p className="text-xs sm:text-sm text-blue-600 mb-1">Professeurs</p>
                              <p className="text-xl sm:text-2xl font-bold text-blue-700">{statistics.dashboard.totalProfs}</p>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl bg-orange-50 border border-orange-200">
                              <p className="text-xs sm:text-sm text-orange-600 mb-1">Classes</p>
                              <p className="text-xl sm:text-2xl font-bold text-orange-700">{statistics.dashboard.totalClasses}</p>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200">
                              <p className="text-xs sm:text-sm text-red-600 mb-1">Taux d'absence global</p>
                              <p className="text-xl sm:text-2xl font-bold text-red-700">{statistics.dashboard.tauxAbsenceGlobal} %</p>
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl bg-amber-50 border border-amber-200 col-span-2 lg:col-span-1">
                              <p className="text-xs sm:text-sm text-amber-700 mb-1">Élève le plus absent</p>
                              {statistics.dashboard.eleveLePlusAbsent ? (
                                <>
                                  <p className="text-sm sm:text-base font-bold text-slate-800 truncate" title={`${statistics.dashboard.eleveLePlusAbsent.prenom} ${statistics.dashboard.eleveLePlusAbsent.nom}`}>
                                    {statistics.dashboard.eleveLePlusAbsent.prenom} {statistics.dashboard.eleveLePlusAbsent.nom}
                                  </p>
                                  <p className="text-xs text-amber-600">{statistics.dashboard.eleveLePlusAbsent.nbAbsences} absence(s)</p>
                                </>
                              ) : (
                                <p className="text-sm text-slate-500">—</p>
                              )}
                            </div>
                            <div className="p-3 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 col-span-2 lg:col-span-1">
                              <p className="text-xs sm:text-sm text-rose-700 mb-1">Classe la plus absente</p>
                              {statistics.dashboard.classeLaPlusAbsente ? (
                                <>
                                  <p className="text-sm sm:text-base font-bold text-slate-800 truncate">{statistics.dashboard.classeLaPlusAbsente.nom}</p>
                                  <p className="text-xs text-rose-600">{statistics.dashboard.classeLaPlusAbsente.nbAbsences} absence(s)</p>
                                </>
                              ) : (
                                <p className="text-sm text-slate-500">—</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Vue globale */}
                      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 text-indigo-600 flex-shrink-0">
                            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-slate-800">Vue globale (filtres)</h4>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                          <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <p className="text-xs sm:text-sm text-slate-600 mb-1">Total</p>
                            <p className="text-xl sm:text-2xl font-bold text-slate-800">
                              {statistics.global.total}
                            </p>
                          </div>
                          <div className="p-3 sm:p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                            <p className="text-xs sm:text-sm text-emerald-600 mb-1">Présents</p>
                            <p className="text-xl sm:text-2xl font-bold text-emerald-700">
                              {statistics.global.presents}
                            </p>
                          </div>
                          <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200">
                            <p className="text-xs sm:text-sm text-red-600 mb-1">Absents</p>
                            <p className="text-xl sm:text-2xl font-bold text-red-700">
                              {statistics.global.absents}
                            </p>
                          </div>
                          <div className="p-3 sm:p-4 rounded-xl bg-orange-50 border border-orange-200">
                            <p className="text-xs sm:text-sm text-orange-600 mb-1">Retards</p>
                            <p className="text-xl sm:text-2xl font-bold text-orange-700">
                              {statistics.global.retards}
                            </p>
                          </div>
                        </div>

                        {/* Graphique */}
                        {statistics.global.total > 0 && (
                          <div className="mt-6">
                            <p className="text-sm font-semibold text-slate-700 mb-4">Répartition globale</p>
                            <div className="flex items-end gap-2 sm:gap-4 h-48 sm:h-64">
                              <div className="flex-1 flex flex-col items-center">
                                <div
                                  className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500"
                                  style={{
                                    height: `${(statistics.global.presents / statistics.global.total) * 100}%`,
                                    minHeight: statistics.global.presents > 0 ? "20px" : "0",
                                  }}
                                />
                                <span className="mt-2 text-xs sm:text-sm text-slate-600">Présents</span>
                                <span className="text-sm sm:text-base font-bold text-slate-800">
                                  {statistics.global.presents}
                                </span>
                              </div>
                              <div className="flex-1 flex flex-col items-center">
                                <div
                                  className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t-lg transition-all duration-500"
                                  style={{
                                    height: `${(statistics.global.absents / statistics.global.total) * 100}%`,
                                    minHeight: statistics.global.absents > 0 ? "20px" : "0",
                                  }}
                                />
                                <span className="mt-2 text-xs sm:text-sm text-slate-600">Absents</span>
                                <span className="text-sm sm:text-base font-bold text-slate-800">
                                  {statistics.global.absents}
                                </span>
                              </div>
                              <div className="flex-1 flex flex-col items-center">
                                <div
                                  className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg transition-all duration-500"
                                  style={{
                                    height: `${(statistics.global.retards / statistics.global.total) * 100}%`,
                                    minHeight: statistics.global.retards > 0 ? "20px" : "0",
                                  }}
                                />
                                <span className="mt-2 text-xs sm:text-sm text-slate-600">Retards</span>
                                <span className="text-sm sm:text-base font-bold text-slate-800">
                                  {statistics.global.retards}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Graphique des absences par mois */}
                      {statistics.absencesParMois && statistics.absencesParMois.length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                          <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Absences par mois</h4>
                          <div className="flex items-end gap-2 sm:gap-3 h-52 overflow-x-auto pb-8">
                            {statistics.absencesParMois.map((item) => {
                              const maxAbs = Math.max(...statistics.absencesParMois.map((x) => x.absences), 1);
                              const h = (item.absences / maxAbs) * 100;
                              return (
                                <div key={item.mois} className="flex flex-col items-center flex-1 min-w-[48px]">
                                  <span className="text-xs font-semibold text-slate-700 mb-1">{item.absences}</span>
                                  <div
                                    className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t transition-all duration-500 min-h-[4px]"
                                    style={{ height: `${Math.max(h, 2)}%` }}
                                  />
                                  <span className="mt-2 text-[10px] sm:text-xs text-slate-500 text-center leading-tight">{item.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Évolution du taux de présence */}
                      {statistics.evolutionTauxPresence && statistics.evolutionTauxPresence.length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                          <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Évolution du taux de présence</h4>
                          <div className="flex items-end gap-2 sm:gap-3 h-52 overflow-x-auto pb-8">
                            {statistics.evolutionTauxPresence.map((item) => (
                              <div key={item.mois} className="flex flex-col items-center flex-1 min-w-[48px]">
                                <span className="text-xs font-semibold text-emerald-700 mb-1">{item.tauxPresence} %</span>
                                <div
                                  className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t transition-all duration-500 min-h-[4px]"
                                  style={{ height: `${item.tauxPresence}%` }}
                                />
                                <span className="mt-2 text-[10px] sm:text-xs text-slate-500 text-center leading-tight">{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Graphique par classe (répartition présents / absents / retards) */}
                      {statistics.comparaisonClasses && statistics.comparaisonClasses.length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                          <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Répartition par classe</h4>
                          <div className="space-y-4">
                            {statistics.comparaisonClasses.map((c) => (
                              <div key={c.nom}>
                                <div className="flex justify-between text-xs sm:text-sm mb-1">
                                  <span className="font-medium text-slate-700">{c.nom}</span>
                                  <span className="text-slate-500">Total: {c.total} · Présents: {c.presents} · Absents: {c.absents}</span>
                                </div>
                                <div className="flex h-8 rounded-lg overflow-hidden bg-slate-100">
                                  {c.total > 0 && (
                                    <>
                                      <div
                                        className="bg-emerald-500 transition-all"
                                        style={{ width: `${(c.presents / c.total) * 100}%` }}
                                        title={`Présents: ${c.presents}`}
                                      />
                                      <div
                                        className="bg-red-500 transition-all"
                                        style={{ width: `${(c.absents / c.total) * 100}%` }}
                                        title={`Absents: ${c.absents}`}
                                      />
                                      <div
                                        className="bg-orange-500 transition-all"
                                        style={{ width: `${(c.retards / c.total) * 100}%` }}
                                        title={`Retards: ${c.retards}`}
                                      />
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comparaison entre classes (taux de présence) */}
                      {statistics.comparaisonClasses && statistics.comparaisonClasses.length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                          <h4 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Comparaison entre classes (taux de présence)</h4>
                          <div className="space-y-3">
                            {statistics.comparaisonClasses.map((c) => (
                              <div key={c.nom}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium text-slate-700">{c.nom}</span>
                                  <span className="font-bold text-emerald-700">{c.tauxPresence} %</span>
                                </div>
                                <div className="h-6 rounded-full overflow-hidden bg-slate-200">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                    style={{ width: `${c.tauxPresence}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Par classe */}
                      {Object.keys(statistics.parClasse).length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-100 text-orange-600 flex-shrink-0">
                              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-800">Par classe</h4>
                          </div>

                          <div className="space-y-4">
                            {Object.entries(statistics.parClasse).map(([classeNom, stats]) => (
                              <div
                                key={classeNom}
                                className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-slate-50 to-orange-50 border border-slate-200"
                              >
                                <p className="font-semibold text-slate-800 mb-3 text-sm sm:text-base">
                                  {classeNom}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                                  <div className="text-center p-2 rounded-lg bg-white">
                                    <p className="text-xs text-slate-600">Total</p>
                                    <p className="text-base sm:text-lg font-bold text-slate-800">{stats.total}</p>
                                  </div>
                                  <div className="text-center p-2 rounded-lg bg-emerald-50">
                                    <p className="text-xs text-emerald-600">Présents</p>
                                    <p className="text-base sm:text-lg font-bold text-emerald-700">{stats.presents}</p>
                                  </div>
                                  <div className="text-center p-2 rounded-lg bg-red-50">
                                    <p className="text-xs text-red-600">Absents</p>
                                    <p className="text-base sm:text-lg font-bold text-red-700">{stats.absents}</p>
                                  </div>
                                  <div className="text-center p-2 rounded-lg bg-orange-50">
                                    <p className="text-xs text-orange-600">Retards</p>
                                    <p className="text-base sm:text-lg font-bold text-orange-700">{stats.retards}</p>
                                  </div>
                                </div>

                                {/* Mini graphique */}
                                {stats.total > 0 && (
                                  <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-slate-200">
                                    <div
                                      className="bg-emerald-500 transition-all duration-500"
                                      style={{ width: `${(stats.presents / stats.total) * 100}%` }}
                                    />
                                    <div
                                      className="bg-red-500 transition-all duration-500"
                                      style={{ width: `${(stats.absents / stats.total) * 100}%` }}
                                    />
                                    <div
                                      className="bg-orange-500 transition-all duration-500"
                                      style={{ width: `${(stats.retards / stats.total) * 100}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Par cours */}
                      {Object.keys(statistics.parCours).length > 0 && (
                        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg shadow-slate-200/50 border border-slate-200/60">
                          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <h4 className="text-base sm:text-lg font-bold text-slate-800">Par cours</h4>
                          </div>

                          <div className="space-y-3">
                            {Object.entries(statistics.parCours).map(([coursNom, stats]) => (
                              <div
                                key={coursNom}
                                className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200"
                              >
                                <p className="font-semibold text-slate-800 mb-2 text-sm sm:text-base">
                                  {coursNom}
                                </p>
                                <div className="flex gap-3 text-xs sm:text-sm">
                                  <span className="text-emerald-600">
                                    Présents: <strong>{stats.presents}</strong>
                                  </span>
                                  <span className="text-red-600">
                                    Absents: <strong>{stats.absents}</strong>
                                  </span>
                                  <span className="text-orange-600">
                                    Retards: <strong>{stats.retards}</strong>
                                  </span>
                                  <span className="text-slate-600">
                                    Total: <strong>{stats.total}</strong>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-white rounded-xl sm:rounded-2xl p-8 sm:p-12 shadow-lg shadow-slate-200/50 border border-slate-200/60 text-center">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-600 text-sm sm:text-base">Chargement des statistiques...</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardAdmin;
