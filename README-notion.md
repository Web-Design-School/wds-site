# Brancher le formulaire d'inscription directement à Notion (sans Make)

Le formulaire (`inscription.html`) envoie maintenant ses données à une fonction
Netlify (`netlify/functions/notion-submit.js`) qui les transmet directement à
l'API Notion. Aucune plateforme tierce n'est nécessaire.

## 1. Créer la base Notion

Crée une base de données Notion avec **exactement** ces propriétés
(le nom et le type comptent) :

| Nom de la propriété | Type          |
|----------------------|---------------|
| Nom                  | Titre         |
| Email                | Email         |
| WhatsApp             | Téléphone     |
| Ville / Pays         | Texte         |
| Situation            | Sélection     |
| Fréquence ordi       | Sélection     |
| Aisance ordi         | Sélection     |
| Outils               | Sélection multiple |
| Motivation           | Texte         |
| Source               | Texte         |
| Engagement           | Sélection     |
| Score                | Nombre        |
| Statut prospect      | Sélection     |
| Cohorte              | Texte         |
| Page source          | Texte         |
| CTA cliqué           | Texte         |
| Date                 | Date          |

Tu n'es pas obligé de créer les options des menus "Sélection" à l'avance —
Notion les crée automatiquement à la première insertion si l'intégration a la
permission d'éditer le contenu.

## 2. Créer une intégration Notion (clé API)

1. Va sur https://www.notion.so/my-integrations
2. "New integration" → donne-lui un nom (ex. "WDS Inscriptions")
3. Associe-la à ton espace de travail, coche les permissions "Insert content"
4. Copie le **Internal Integration Secret** (commence par `ntn_` ou `secret_`)
   → c'est ta `NOTION_API_KEY`

## 3. Partager la base avec l'intégration

Ouvre ta base Notion → bouton `•••` en haut à droite → "Connexions" →
recherche et ajoute ton intégration ("WDS Inscriptions"). Sans cette étape,
l'API refusera toutes les requêtes même avec une clé valide.

## 4. Récupérer l'ID de la base

Ouvre la base en plein écran dans le navigateur. L'URL ressemble à :

```
https://www.notion.so/tonworkspace/1a2b3c4d5e6f7890abcd1234ef567890?v=...
```

L'ID de la base est la partie de 32 caractères juste après le nom du
workspace (`1a2b3c4d5e6f7890abcd1234ef567890` dans l'exemple) → c'est ta
`NOTION_DATABASE_ID`.

## 5. Ajouter les variables d'environnement dans Netlify

Dans le dashboard Netlify de ton site : **Site settings → Environment
variables → Add a variable**

- `NOTION_API_KEY` = le secret copié à l'étape 2
- `NOTION_DATABASE_ID` = l'ID copié à l'étape 4

## 6. Déployer avec les fonctions

Un simple glisser-déposer du dossier ne suffit pas pour les fonctions
serverless. Utilise la CLI Netlify :

```bash
npm install -g netlify-cli   # si pas déjà installé
netlify login
netlify deploy --prod
```

Depuis le dossier du site (celui qui contient `netlify.toml`,
`netlify/functions/` et les fichiers `.html`). La CLI détecte
automatiquement `netlify.toml` et déploie la fonction avec le site.

Si ton site est déjà connecté à un dépôt Git, il suffit de pousser ces
fichiers (`netlify.toml`, `netlify/functions/notion-submit.js`,
`inscription.html` modifié) — Netlify redéploiera automatiquement et créera
la fonction.

## 7. Tester

Une fois déployé, remplis le formulaire sur le site en ligne et vérifie
qu'une nouvelle ligne apparaît dans la base Notion. En cas de souci, les
logs sont visibles dans Netlify : **Site → Functions → notion-submit → Logs**
(les erreurs Notion y sont affichées en clair).
