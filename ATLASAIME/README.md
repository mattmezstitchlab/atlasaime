# ATLAS × AIME

Compositeur de pages à partir des projets publics de `mattmezstitchlab` : canevas éditable, visionneuse GitHub/YouTube, design systems, chronologie des projets et bureau documentaire.

## Parcours recentré

- L’accueil privilégie l’exploration/comparaison et la lecture des documents.
- L’atelier regroupe trois méthodes : idée, choix manuel et domaine. Le brief est traité immédiatement par des règles locales, sans étapes d’agents simulées.
- Les sources proposées restent à vérifier ; les spécialités sont présentées comme références documentaires.
- Les estimations sont conservées dans une section secondaire repliée. Les design systems restent accessibles depuis les outils visuels et les vues de projets.
- Le mode domaine extrait des textes de README, pas des composants fonctionnels. Les textes de liaison utilisent des modèles locaux.
- Les anciennes compositions locales sont conservées. Le format additionnel `atlas.backup` permet désormais la restauration complète. Aucune synchronisation entre appareils n’est connectée.

Tests de rendu (sans navigateur) : `node --test tests/workspace.test.mjs`.

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

Une configuration CI séparée est fournie pour installation propre, TypeScript, tests, build et audit production. Son ajout dans `.github/workflows/ci.yml` reste à effectuer via un accès GitHub autorisé à modifier les workflows ; aucun workflow n’est installé par cette PR.

## Publication sur Vercel

1. Importez le dépôt GitHub dans Vercel.
2. Gardez la racine du projet comme **Root Directory**.
3. Choisissez le preset **Vite** (détecté automatiquement).
4. Vérifiez ces valeurs : installation `npm ci`, build `npm run build`, sortie `dist`, Node.js 20.
5. Déployez. Les pushes sur la branche de production créent un déploiement de production; les pull requests obtiennent des preview deployments si l'intégration Git Vercel est activée.

Aucune variable d'environnement n'est requise. `vercel.json` ajoute des en-têtes de sécurité adaptés à cette application statique. Il n'y a volontairement pas de CSP stricte : les compositions affichent des sites tiers, YouTube, des captures externes et Google Fonts dans des iframes. L'application n'a pas besoin d'être elle-même embarquée dans un autre site.

### État des audits npm

Le plugin `vite-plugin-singlefile` est mis à jour vers 2.3.4 pour retirer la chaîne vulnérable signalée dans l’audit précédent. Vérifier régulièrement `npm audit` et éviter les corrections forcées non testées.

## Fonctionnement et limites de production

- **Frontend statique** : aucune API serveur ATLAS, base de données, authentification, secret ou déploiement de code généré n'est connecté.
- **Sauvegarde locale** : compositions, conditions cochées et signaux sont enregistrés dans le navigateur. Ils ne sont pas synchronisés entre appareils et leur suppression du stockage du navigateur est irréversible.
- **Partage** : le lien en lecture seule embarque la composition dans le fragment `#lecture=…`. Ce n'est ni chiffré ni un contrôle d'accès. Ne partagez pas de données privées ou personnelles dans un lien.
- **Assistant** : ses règles, sélections de spécialités et actions sur le canevas s'exécutent côté navigateur à partir des documents et projets publics disponibles. Aucun appel à un modèle IA distant n'est effectué. Il sait créer un brouillon de site composé de vrais fragments et de sections texte modifiables ; il ne génère ni backend, ni paiement, ni compte, ni code déployé.
- **Signaux à l'assistant** : un bouton prépare et copie une consigne sourcée. Il ne peut pas contacter une conversation ChatGPT automatiquement. La consigne doit être collée dans la conversation pour que l'assistant externe puisse agir.
- **GitHub** : un instantané public est inclus pour un premier rendu. La synchronisation directe utilise l'API publique non authentifiée; elle est soumise aux limites de débit GitHub. Aucun token privé ne doit être placé dans une variable `VITE_*`.
- **YouTube** : la liste est un instantané des 15 éléments fournis par le flux public de la chaîne lors du relevé. Une actualisation complète nécessiterait un connecteur ou une API configurée côté serveur.
- **Sources externes** : les sites qui refusent les iframes sont présentés en capture lorsqu'elle existe. Les miniatures, polices, sites et embeds nécessitent une connexion internet et peuvent changer ou disparaître.
- **Import de fichiers** : images, vidéos et PDF sont lus intégralement pour une sauvegarde portable (10 Mo par fichier maximum). Le quota réel du navigateur reste plus bas sur certains appareils : un échec est signalé et le travail reste uniquement en mémoire jusqu’à un export ou une sauvegarde réussie. Les anciennes URL `blob:` ne sont pas récupérables après expiration ; réimporter le fichier.
- **Estimations** : la complétion mesure les preuves publiques et les conditions cochées localement. La fourchette en euros est un coût illustratif de reconstruction, non un revenu, devis ou prix de marché.
- **Fusions** : les cartes sont des propositions documentées pour aider à préparer une architecture. Aucune fusion Git, migration, écriture dans les dépôts sources ou publication n'est exécutée par ATLAS.

## Accès Git et déploiement

Dans l'environnement de réalisation, le dossier n'avait pas de répertoire `.git`, de remote GitHub, de configuration Vercel ou de jeton de publication. Les fichiers et vérifications sont préparés, mais aucun push vers votre compte ni déploiement Vercel ne peut être effectué sans ces accès. Le guide ci-dessus permet de les connecter sans intégrer de secret au code.

## Aperçus des dépôts

Les cartes de l’accueil et de la visionneuse distinguent les captures de sites (service externe), les visuels déclarés dans les métadonnées et les maquettes indicatives. Sans site disponible ni visuel déclaré, un schéma SVG local est composé à partir de la catégorie et des métadonnées. Il ne reconstruit pas le code et porte la mention « Maquette — non fonctionnelle ». Si une image distante échoue, la carte revient à cette maquette. Le canevas reçoit également ces posters de remplacement.

Cette étape ne lance aucun dépôt pour en prendre une capture, ne recherche pas automatiquement les images des README et ne publie aucun des projets sources. Une image d’erreur renvoyée avec HTTP 200 par le service externe ne peut pas être détectée comme un échec de chargement. Les captures ou visuels peuvent être anciens ; leur présence ne prouve pas qu’une application fonctionne.

## Fiabilité : sauvegarde, restauration et partage

- Aucune suppression automatique au-delà de 24 compositions ; toutes restent accessibles dans le carrousel de l’accueil.
- Une erreur d’écriture conserve les compositions et médias en mémoire dans l’onglet, sans tronquer la sauvegarde précédente. Une alerte persistante propose l’export et le navigateur est averti avant fermeture. Cela ne garantit pas la survie d’un onglet fermé ou d’un navigateur interrompu.
- Un stockage existant illisible est protégé contre l’écrasement pendant la session. Conserver une copie des données brutes avant toute réparation manuelle ; aucun reset destructif n’est automatique.
- Accueil : télécharger toutes les compositions ou restaurer un fichier `atlas.backup` v1. Restauration en copies avec de nouveaux identifiants, sans remplacer les projets déjà présents. Éditeur → Export : sauvegarde complète de la composition courante. Le JSON technique historique reste distinct et n’est pas une sauvegarde restaurable.
- Les fichiers embarqués sont inclus dans la sauvegarde complète, non chiffrée (40 Mo par fichier de sauvegarde maximum). Les URL externes et dépôts ne sont pas archivés avec leur contenu ; leur disponibilité future n’est pas garantie. Les anciennes références `blob:` bloquent l’export portable plutôt que de produire une fausse sauvegarde complète.
- Les nouveaux liens d’assemblage v2 transportent les fragments et textes de liaison, le domaine et l’ordre. Les anciens liens par identifiants restent lisibles, sans pouvoir récupérer des informations qu’ils n’avaient jamais embarquées. Limite : 200 000 caractères ; utiliser l’export au-delà. Les liens sont publics à toute personne qui les possède, non chiffrés et non révocables.
- La copie dans le presse-papiers n’annonce un succès qu’après confirmation. Les entrées partagées et les sauvegardes restaurées passent une validation de structure et de protocoles ; ce n’est pas un contrôle d’accès.
- Le stockage reste `localStorage`, sans compte ni synchronisation et sans verrou multi-onglets. Une base locale de médias (IndexedDB) et des tests d’interaction navigateur sont les prochaines étapes, pas des fonctions déjà livrées.

Les commandes de contrôle TypeScript, tests, build et audit des dépendances ont été exécutées localement ; la CI distante reste à installer. Recette navigateur à effectuer avant fusion : importer image/PDF/vidéo, exporter, recharger, restaurer sur un autre profil, tester le refus du presse-papiers et du stockage, puis ouvrir un assemblage partagé dans une session vierge.

## Vue simple

L’entrée principale est désormais le catalogue des projets avec recherche, domaine et sélection. La navigation présente Projets, Documents et Mes compositions. Les trois dernières compositions sont proposées sur l’accueil ; toutes restent accessibles dans Mes compositions, avec duplication et suppression confirmée.

Le parcours de création est : sélectionner des projets, choisir Page / Grille / Diaporama, nommer, puis ajuster dans l’atelier. Une présentation vide reste possible. La comparaison des projets sélectionnés conserve la visionneuse existante. La fiche de chaque carte donne accès à la préparation d’une présentation.

L’atelier démarre en mode simple : bibliothèque fermée, réglages simples sur grand écran (nom, trois formats, texte du bloc, remplacement et ordre). Les réglages avancés réactivent l’inspecteur complet, le graphe, les supports, le recadrage et l’assistant local. Les raccourcis et menus contextuels historiques restent disponibles : il ne s’agit pas d’une restriction de permissions. Sur petit écran, les panneaux restent accessibles par leurs boutons.

Les anciens parcours (brief, domaine, modèles, propositions de fusion et estimations) sont conservés dans Outils avancés avec retour à la vue simple. Aucun format de sauvegarde n’a changé dans ce lot. Cette simplification est ergonomique : tous les modules avancés sont encore dans le bundle, ce n’est pas encore une optimisation du poids de chargement.

## Atelier à sections

Le mode simple organise le travail comme un document : plan numéroté à gauche, sections centrales et réglages de la sélection à droite. La sélection est commune au plan, au contour de section et au panneau ; un choix dans le plan fait défiler le document. Le plan propose Monter/Descendre (verrous de position respectés), pas encore de glisser-déposer.

Les boutons « + Ajouter ici » créent une section vide à la position indiquée puis ouvrent le choix de contenu. Annuler ce choix laisse la section vide, supprimable depuis les réglages. La duplication copie les fragments personnalisés pour que leurs textes puissent être modifiés indépendamment. La légende, le titre et le corps du texte restent modifiables quand le contenu n’est pas verrouillé.

Aperçu masque plan, contours et commandes de section. Page est une séquence verticale, Grille présente deux colonnes sur grand écran, Diaporama permet de passer d’une section à la suivante. Les liens de lecture seule utilisent ce rendu pour les trois formats simples ; les autres formats historiques conservent leur présentation avancée. Le document simple est une vue de travail, pas une reproduction pixel à pixel des mises en page avancées. Leurs coordonnées et réglages sont conservés sans migration du stockage.

Sur petit écran, le plan est dépliable et les réglages s’ouvrent en panneau inférieur. Le mode avancé conserve le canevas libre et ses outils. La barre supérieure propose Aperçu, Annuler/Rétablir et un statut de sauvegarde ; aucune sauvegarde distante n’est ajoutée. Recette navigateur restant à faire : défilement synchronisé, insertion/remplacement, duplication de texte, ordre, changements de format, lecture seule et panneaux mobiles.

## Atelier unifié (remplace la bascule simple / avancé)

Le panneau de gauche réunit Plan et Bibliothèque. Ajouter crée une section à la position voulue et ouvre la bibliothèque existante ; Remplacer utilise la même bibliothèque en indiquant sa destination. Les imports URL/fichier/texte restent dans les dialogues existants. Une seule sélection pilote plan, document et réglages.

Mise en page ouvre les propriétés du document. Les réglages rapides et l’inspecteur historique sont regroupés dans le panneau droit, ce dernier dans « Mise en page et réglages détaillés ». Les changements de mise en page conservent le nombre, l’ordre et les contenus des blocs : ils ne rajoutent plus automatiquement des cases vides. Les réglages détaillés historiques ne sont pas tous représentés dans la vue document ; l’unification complète de leurs effets visuels reste une étape ultérieure.

La palette regroupe Sélection, Ajouter, Texte et Recadrer selon le contenu sélectionné. Le déplacement de vue reste celui du défilement pour les documents ; le format Libre conserve le canevas géométrique et ses outils spécifiques. Ce n’est plus un mode ancien/nouveau choisi par un bouton. Les composants de rendu géométrique ne sont pas supprimés car ils restent nécessaires aux anciennes compositions libres.

Les documents utilisent le même composant pour édition, aperçu et lecture seule ; les repères d’édition sont masqués en aperçu. La grille à deux colonnes est visible pendant l’édition aussi. Le diaporama reste une liste de travail en édition et une présentation séquencée en aperçu. Aucun moteur de site externe comparable à Framer n’est intégré et aucune performance nouvelle n’est garantie. Recette navigateur à faire : bibliothèque sur ordinateur/mobile, insertion et remplacement, conservation des blocs lors des changements de format, recadrage et rendu des compositions libres.

## Médiathèque visuelle

Dans Bibliothèque, une médiathèque affiche les images et des lecteurs vidéo/audio à la demande (sans lecture automatique ni préchargement complet). Les PDF s’ouvrent par lien, sans rendu de première page. Recherche par nom/projet/chemin et filtres de source et type. Le bouton d’insertion est distinct de l’aperçu : consulter un média ne modifie pas la composition.

Les imports multiples ou déposés depuis l’ordinateur sont conservés comme fichiers dans IndexedDB, par appareil et origine du site, avec dédoublonnage SHA-256 (100 Mo maximum par fichier, sous réserve du quota du navigateur). Seuls les fichiers explicitement choisis sont lus. La médiathèque n’est pas synchronisée, pas sauvegardée dans le fichier d’export des compositions et peut être perdue si les données du site sont effacées. Garder les originaux sur l’ordinateur. Pas de suppression de fichier ou de favoris dans cette première étape.

Lors de l’insertion, un fichier local est embarqué dans la composition (10 Mo maximum), ce qui permet la sauvegarde complète existante, mais reste soumis au quota localStorage et aux alertes de sauvegarde. Les URL blob utilisées pour les lecteurs sont temporaires et révoquées au démontage ; les fichiers persistants restent dans IndexedDB. La conservation de fichiers plus gros n’implique pas qu’ils puissent être insérés dans une composition.

GitHub : choisir un dépôt du catalogue et lancer Indexer. L’API publique est interrogée sans token, donc seuls les dépôts publics accessibles sont indexables, sous limite de débit. Le catalogue des dépôts n’est pas un index automatique de tous leurs médias. L’arbre récursif est filtré par extension, hors node_modules/.git/dist ; un arbre tronqué est signalé. Les liens raw sont épinglés au SHA de l’arbre retourné et conservent la provenance. L’indexation est additive, ne purge pas les anciens chemins et n’inclut pas les sous-modules, fichiers LFS téléchargés, médias externes cités dans les README ou dépôts privés. Le rendu dépend du format pris en charge par le navigateur et de la disponibilité des fichiers distants.

Tests IndexedDB simulés via fake-indexeddb (dépendance de développement uniquement). Recette navigateur toujours nécessaire : import multiple et glisser-déposer, rechargement, lecture audio/vidéo, quota refusé, indexation GitHub, insertion dans la destination choisie, export/restauration de la composition et usage mobile.

## Portfolio public

`/portfolio` présente un catalogue public visuel distinct de l’atelier (`/`). Il utilise uniquement l’instantané des dépôts publics non vides, jamais les compositions du navigateur, les imports locaux ou IndexedDB. Les grands visuels conservent les badges de provenance (capture externe, visuel ou maquette indicative). Aucun visuel du site de référence n’est copié.

Les concepts des projets principaux sont rédigés depuis leurs titres/descriptions publics ; les autres utilisent leurs métadonnées ou un texte explicite « concept à documenter ». Ce ne sont ni des preuves de fonctionnalités ni des déclarations de maturité. La sélection et les textes sont éditables dans `src/data/portfolio.ts`, avec recherche et filtre de domaine. L’index est un instantané, pas une publication automatique des nouveaux dépôts.

Route `/portfolio` et `/portfolio/` réécrite vers l’entrée SPA. Le portfolio ne constitue pas une protection d’accès pour l’atelier, qui reste accessible. Page cliente : titre actualisé côté navigateur ; métadonnées sociales/prérendu SEO spécifiques à améliorer dans une étape distincte. Pas de copie de biographie, coordonnées ou références clients du site d’inspiration. Vérifier visuellement sur mobile/ordinateur et valider les descriptifs avant publication.

### Mosaïque et défilement

Le portfolio possède un conteneur `100dvh` avec défilement vertical : il ne dépend plus du body verrouillé par l’atelier. Le retour en haut cible ce conteneur. Galerie en trois colonnes sur ordinateur, deux sur tablette et une sur téléphone, avec titre/catégorie avant le visuel, mode liste et thème clair/sombre. Les concepts s’ouvrent dans une boîte de dialogue native (fermeture par bouton ou Échap). La direction est inspirée des captures fournies, sans reprendre leurs images ou projets. Recette navigateur requise pour scroll, focus/fermeture de la fenêtre et responsive.
