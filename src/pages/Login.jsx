import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginRequest } from "../services/auth";
import { Eye, EyeOff, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";

/**
 * Page de connexion — style moderne administratif
 * Validation email/mot de passe, toggle afficher mot de passe, redirection par rôle
 */
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError("L'email est requis");
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError("Format d'email invalide");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value) => {
    if (!value) {
      setPasswordError("Le mot de passe est requis");
      return false;
    }
    if (value.length < 3) {
      setPasswordError("Le mot de passe doit contenir au moins 3 caractères");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(email) || !validatePassword(password)) return;

    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      login(data, data.token);
      if (data.role === "ADMIN") navigate("/dashboard/admin", { replace: true });
      else if (data.role === "PROF") navigate("/dashboard/prof", { replace: true });
      else navigate("/dashboard/eleve", { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Panneau gauche — branding administratif */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-800 flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3 text-white">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-700">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xl font-semibold tracking-tight">Gestion Scolaire</span>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white mb-3">Portail de connexion</h1>
          <p className="text-slate-400 max-w-sm">
            Accédez à votre espace selon votre rôle : administrateur, professeur ou élève.
          </p>
        </div>
        <p className="text-slate-500 text-sm">© 2026 — Présences & justifications</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Visible sur mobile : titre court */}
          <div className="lg:hidden flex items-center gap-3 text-slate-800 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-lg font-semibold">Gestion Scolaire</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 sm:p-10">
            <h2 className="text-xl font-semibold text-slate-800 mb-1">Connexion</h2>
            <p className="text-slate-500 text-sm mb-6">Saisissez vos identifiants pour accéder à votre espace.</p>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all ${
                      emailError ? "border-red-400" : "border-slate-200"
                    }`}
                    placeholder="vous@etablissement.com"
                    required
                  />
                </div>
                {emailError && <p className="mt-1.5 text-sm text-red-600">{emailError}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) validatePassword(e.target.value);
                    }}
                    onBlur={() => validatePassword(password)}
                    className={`w-full pl-10 pr-11 py-3 rounded-xl border bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-transparent transition-all ${
                      passwordError ? "border-red-400" : "border-slate-200"
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && <p className="mt-1.5 text-sm text-red-600">{passwordError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-slate-800 text-white font-medium rounded-xl shadow-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Accès réservé au personnel et aux élèves de l'établissement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;