// 🔐 Fonctions utilitaires liées à l'authentification côté front
// On s'appuie sur l'API backend /api/users/login qui renvoie
// l'utilisateur + un token JWT.

import { api } from "./api";

// Connexion : renvoie les données renvoyées par l'API (user + token)
export const loginRequest = async (email, password) => {
  // On laisse remonter les erreurs (gérées dans le composant)
  return api.post("/users/login", { email, password });
};

