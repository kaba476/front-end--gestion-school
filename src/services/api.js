// En production, définir VITE_API_URL dans .env (ex: https://ton-api.onrender.com/api)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MESSAGE_ERREUR_RESEAU =
  "Impossible de joindre le serveur. Vérifiez votre connexion.";

// Parse la réponse en JSON sans planter si le serveur renvoie du HTML (ex. 500)
async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

// Exécute fetch et gère les erreurs réseau (connexion refusée, timeout, etc.)
async function fetchSafe(url, options) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(MESSAGE_ERREUR_RESEAU);
    }
    throw err;
  }
}

export const api = {
  post: async (endpoint, data, token) => {
    const res = await fetchSafe(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    const json = await parseJsonSafe(res);
    if (!res.ok) {
      throw new Error(json.message || MESSAGE_ERREUR_RESEAU);
    }
    return json;
  },

  get: async (endpoint, token) => {
    const res = await fetchSafe(`${API_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    const json = await parseJsonSafe(res);
    if (!res.ok) {
      throw new Error(json.message || MESSAGE_ERREUR_RESEAU);
    }
    return json;
  },

  put: async (endpoint, data, token) => {
    const res = await fetchSafe(`${API_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data || {}),
    });
    const json = await parseJsonSafe(res);
    if (!res.ok) {
      throw new Error(json.message || MESSAGE_ERREUR_RESEAU);
    }
    return json;
  },

  patch: async (endpoint, data, token) => {
    const res = await fetchSafe(`${API_URL}${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(data || {}),
    });
    const json = await parseJsonSafe(res);
    if (!res.ok) {
      throw new Error(json.message || MESSAGE_ERREUR_RESEAU);
    }
    return json;
  },

  delete: async (endpoint, token) => {
    const res = await fetchSafe(`${API_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    const json = await parseJsonSafe(res);
    if (!res.ok) {
      throw new Error(json.message || MESSAGE_ERREUR_RESEAU);
    }
    return json;
  },
};
