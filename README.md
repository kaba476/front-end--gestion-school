# Frontend — Gestion des présences scolaires

Interface React du projet **Gestion des présences scolaires**. Elle communique avec l’API backend (Node/Express) et propose trois espaces selon le rôle : Admin, Professeur, Élève.

---

## Sommaire

- [Technologies](#technologies)
- [Structure](#structure)
- [Installation](#installation)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts](#scripts)
- [Pages et rôles](#pages-et-rôles)
- [Conclusion](#conclusion)
- [Aperçu de ce qui a été réalisé](#aperçu-de-ce-qui-a-été-réalisé)

---

## Technologies

- **React 19** avec **Vite**
- **React Router** (routes protégées par rôle)
- **Tailwind CSS** pour le style
- **Bootstrap** (CSS) pour grilles et utilitaires
- Appels API via **fetch** (service `api.js` avec base URL configurable)

---

## Structure

```
gestion-school-front/
├── README.md           ← ce fichier
├── .env.example        (modèle VITE_API_URL)
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx        (point d’entrée, AuthProvider + ErrorProvider)
    ├── App.jsx         (routes : /login, /dashboard/admin|prof|eleve, 404)
    ├── App.css / index.css
    ├── context/
    │   ├── AuthContext.jsx   (utilisateur connecté, rôle, login/logout)
    │   └── ErrorContext.jsx  (messages erreur/succès globaux)
    ├── pages/
    │   ├── Login.jsx
    │   ├── NotFound.jsx      (page 404)
    │   └── dashboard/
    │       ├── DashboardAdmin.jsx + .css
    │       ├── DashboardProf.jsx + .css
    │       └── DashboardEleve.jsx + .css
    ├── components/
    │   ├── JustificationForm.jsx
    │   └── Sidebar.jsx
    ├── services/
    │   ├── api.js      (get, post, put, delete ; base URL = VITE_API_URL)
    │   └── auth.js
    ├── utils/
    │   ├── formatDate.js
    │   └── storage.js
    └── assets/
```

---

## Installation

```bash
cd gestion-school-front
npm install
```

---

## Variables d'environnement

Copier `.env.example` en `.env` (ou `.env.production` pour la prod).

| Variable        | Description |
|-----------------|-------------|
| `VITE_API_URL`  | URL de l’API backend (ex. `http://localhost:5000/api` en dev, URL de prod pour le déploiement) |

Sans variable, le défaut est `http://localhost:5000/api`.

---

## Scripts

| Commande        | Effet |
|-----------------|--------|
| `npm run dev`   | Lance le serveur de dev (Vite) — par défaut `http://localhost:5173` |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualise le build (servir `dist/`) |
| `npm run lint`  | Lance ESLint |

---

## Pages et rôles

- **`/`** → redirection vers `/login`
- **`/login`** → connexion ; si déjà connecté, redirection vers le dashboard selon le rôle
- **`/dashboard/admin`** → réservé Admin (vue d’ensemble, classes, cours, présences, justifications, alertes, convocations, stats)
- **`/dashboard/prof`** → réservé Prof (appels, élèves, alertes de convocation)
- **`/dashboard/eleve`** → réservé Élève (présences, justifications, alertes)
- Toute autre route → **page 404** (`NotFound.jsx`)

Les dashboards utilisent une **navigation par onglets** (sans changer de route) et une charte visuelle commune (slate, emerald).

---

## Conclusion

Le frontend constitue l’interface unique de l’application de gestion des présences. Il repose sur React et Vite, avec une séparation claire entre contexte d’authentification, gestion des erreurs, services API et pages par rôle. L’URL de l’API est configurable via `VITE_API_URL` pour le développement local et le déploiement (voir le README à la racine du projet et le guide **DEPLOIEMENT.md** pour héberger l’ensemble).

---

## Aperçu de ce qui a été réalisé

- **Authentification** : page Login, contexte `AuthContext` (user, rôle, token), routes protégées selon le rôle (Admin, Prof, Élève) avec redirection automatique.
- **API** : service `api.js` centralisé (get, post, put, delete) avec base URL via `VITE_API_URL`, gestion des erreurs réseau et parsing JSON sécurisé.
- **Erreurs et retours utilisateur** : contexte `ErrorContext` avec `showError`, `showSuccess`, `hideError` pour afficher des messages globaux (toast/bandeaux) sur les actions (ex. validation des présences, succès, erreurs).
- **Dashboards** : trois dashboards (Admin, Prof, Élève) avec navigation par onglets, charte commune (slate-800, emerald, « Gestion Scolaire », icône ShieldCheck), sans menu inutile (ex. « Avis sur les profs » retiré pour l’élève).
- **Fonctionnalités par rôle** : Admin (vue d’ensemble avec rafraîchissement périodique, classes, cours, présences, justifications, alertes, convocations, stats) ; Prof (appels, liste des élèves par cours, alertes de convocation) ; Élève (présences, justifications, alertes « 3 absences non justifiées »).
- **Robustesse** : page 404 dédiée, validation des formulaires côté interface, gestion des erreurs API et messages utilisateur cohérents.
- **Déploiement** : `.env.example` pour `VITE_API_URL`, documentation dans le README racine et dans **DEPLOIEMENT.md** pour un déploiement front (Vercel/Netlify) avec une API hébergée.
