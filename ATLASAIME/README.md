# ATLAS × AIME

Compositeur de pages à partir des projets publics de `mattmezstitchlab` : canevas éditable, visionneuse GitHub/YouTube, design systems, chronologie des projets et bureau documentaire.

## Lancer localement

Prérequis : Node.js 20 et npm.

```bash
npm ci
npm run dev
```

Contrôles avant publication :

```bash
npx tsc --noEmit -p tsconfig.json
npm run build
npm run preview
```

Le dernier build est produit dans `dist/`. Le plugin single-file de Vite rassemble l'application dans `dist/index.html`; les petits fichiers statiques tels que l'icône restent dans `dist/`.

## Publication sur GitHub

Le dossier doit être ajouté à un dépôt GitHub auquel vous avez accès. Dans un terminal ouvert à la racine du projet :

```bash
git init
git add .
git commit -m "Préparer ATLAS pour la production"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/VOTRE-DEPOT.git
git push -u origin main
```

Le workflow `.github/workflows/ci.yml` exécute `npm ci`, le contrôle TypeScript et le build à chaque push sur `main`/`master` et à chaque pull request. Il est en lecture seule et ne déploie pas.

## Publication sur Vercel

1. Importez le dépôt GitHub dans Vercel.
2. Gardez la racine du projet comme **Root Directory**.
3. Choisissez le preset **Vite** (détecté automatiquement).
4. Vérifiez ces valeurs : installation `npm ci`, build `npm run build`, sortie `dist`, Node.js 20.
5. Déployez. Les pushes sur la branche de production créent un déploiement de production; les pull requests obtiennent des preview deployments si l'intégration Git Vercel est activée.

Aucune variable d'environnement n'est requise. `vercel.json` ajoute des en-têtes de sécurité adaptés à cette application statique. Il n'y a volontairement pas de CSP stricte : les compositions affichent des sites tiers, YouTube, des captures externes et Google Fonts dans des iframes. L'application n'a pas besoin d'être elle-même embarquée dans un autre site.

### État des audits npm

`npm audit --omit=dev --audit-level=moderate` est propre (0 vulnérabilité dans les dépendances livrées au navigateur). L'audit complet peut encore signaler `braces`/`micromatch` via `vite-plugin-singlefile` et un avertissement de bas niveau dans `esbuild` : ils ne sont pas embarqués dans `dist`. Le rapport npm ne propose pour le plugin qu'un downgrade `vite-plugin-singlefile@0.9.0`, incompatible avec la version de Vite utilisée ; ne pas exécuter `npm audit fix --force`. Le plugin est appelé avec sa configuration par défaut (`inlinePattern: []`), donc le chemin `micromatch.isMatch` signalé n'est pas invoqué par le build actuel. Réévaluer ce point lorsqu'une version amont corrigée sera disponible.

## Fonctionnement et limites de production

- **Frontend statique** : aucune API serveur ATLAS, base de données, authentification, secret ou déploiement de code généré n'est connecté.
- **Sauvegarde locale** : compositions, conditions cochées et signaux sont enregistrés dans le navigateur. Ils ne sont pas synchronisés entre appareils et leur suppression du stockage du navigateur est irréversible.
- **Partage** : le lien en lecture seule embarque la composition dans le fragment `#lecture=…`. Ce n'est ni chiffré ni un contrôle d'accès. Ne partagez pas de données privées ou personnelles dans un lien.
- **Assistant** : ses règles, sélections de spécialités et actions sur le canevas s'exécutent côté navigateur à partir des documents et projets publics disponibles. Aucun appel à un modèle IA distant n'est effectué. Il sait créer un brouillon de site composé de vrais fragments et de sections texte modifiables ; il ne génère ni backend, ni paiement, ni compte, ni code déployé.
- **Signaux à l'assistant** : un bouton prépare et copie une consigne sourcée. Il ne peut pas contacter une conversation ChatGPT automatiquement. La consigne doit être collée dans la conversation pour que l'assistant externe puisse agir.
- **GitHub** : un instantané public est inclus pour un premier rendu. La synchronisation directe utilise l'API publique non authentifiée; elle est soumise aux limites de débit GitHub. Aucun token privé ne doit être placé dans une variable `VITE_*`.
- **YouTube** : la liste est un instantané des 15 éléments fournis par le flux public de la chaîne lors du relevé. Une actualisation complète nécessiterait un connecteur ou une API configurée côté serveur.
- **Sources externes** : les sites qui refusent les iframes sont présentés en capture lorsqu'elle existe. Les miniatures, polices, sites et embeds nécessitent une connexion internet et peuvent changer ou disparaître.
- **Import de fichiers** : les petits imports sont conservés dans le stockage local du navigateur; les gros fichiers/imports vidéo ne doivent pas être considérés comme synchronisés ou disponibles sur un autre appareil.
- **Estimations** : la complétion mesure les preuves publiques et les conditions cochées localement. La fourchette en euros est un coût illustratif de reconstruction, non un revenu, devis ou prix de marché.
- **Fusions** : les cartes sont des propositions documentées pour aider à préparer une architecture. Aucune fusion Git, migration, écriture dans les dépôts sources ou publication n'est exécutée par ATLAS.

## Accès Git et déploiement

Dans l'environnement de réalisation, le dossier n'avait pas de répertoire `.git`, de remote GitHub, de configuration Vercel ou de jeton de publication. Les fichiers et vérifications sont préparés, mais aucun push vers votre compte ni déploiement Vercel ne peut être effectué sans ces accès. Le guide ci-dessus permet de les connecter sans intégrer de secret au code.