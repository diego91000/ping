# Frontend PING — IDE accessible

Le frontend PING est l'interface web du prototype **AccessDev Lab**. Il est développé avec **React**, **TypeScript** et **Vite**. Il fournit un IDE léger connecté au backend Quarkus : explorateur de fichiers, éditeur de code, commandes vocales, console d'exécution, logs et interface personnalisable.

## Objectif fonctionnel

L'objectif est de permettre à un utilisateur de développer avec un minimum d'interactions physiques classiques. Le frontend doit donc :

- afficher clairement les fichiers du projet ;
- permettre l'ouverture et la modification du code ;
- exécuter un fichier Python ;
- afficher un retour visible après chaque action ;
- permettre l'usage de commandes vocales ;
- rester utilisable sur desktop, tablette et mobile ;
- permettre à l'utilisateur d'adapter l'interface à ses besoins.

## Conformité au pitch

Le pitch demandait un IDE accessible pour des développeurs en situation de handicap moteur. Le frontend y répond par :

- une commande vocale en français ;
- une synthèse vocale de confirmation ;
- des logs visibles ;
- une console de résultat ;
- une interface responsive ;
- des boutons HTML accessibles ;
- des messages d'erreur visibles ;
- des panneaux masquables et redimensionnables pour adapter l'espace de travail.

Variation assumée : le contrôle oculaire n'est pas intégré dans cette version. Le prototype se concentre sur le contrôle vocal, plus stable et démontrable dans le temps du projet.

## Prérequis

- Node.js
- npm
- Backend PING lancé sur `http://localhost:8080`
- Workspace backend configuré avec `FILESYSTEM_DEFAULT_PATH`

Workspace recommandé :

```bash
$HOME/ping-workspace
```

Création manuelle si besoin :

```bash
mkdir -p "$HOME/ping-workspace"
echo 'print("bonjour")' > "$HOME/ping-workspace/main.py"
```

## Installation

Depuis le dossier `front/` :

```bash
npm install
```

## Lancement

```bash
npm run dev
```

Application disponible sur :

```text
http://localhost:5173
```

Le proxy Vite redirige les appels `/api/...` vers le backend Quarkus sur `http://localhost:8080`.

## Build et lint

```bash
npm run build
npm run lint
```

- `npm run build` lance la vérification TypeScript puis génère `dist/`.
- `npm run lint` lance `oxlint`.

## Organisation du code

```text
front/
├── src/
│   ├── api/              # Appels HTTP vers le backend
│   ├── components/
│   │   ├── atoms/        # Boutons, inputs, spinner
│   │   ├── molecules/    # Panel, onglet éditeur, nœud d'arbre
│   │   ├── organisms/    # Grandes zones : fichiers, commande, console, logs
│   │   └── templates/    # Layout global de l'IDE
│   ├── hooks/            # Hooks React, reconnaissance vocale, délais
│   ├── lib/              # Parsing de commandes vocales, matching, sons
│   ├── pages/            # Pages principales
│   ├── store/            # Store des logs d'activité
│   ├── styles/           # Styles globaux
│   └── utils/            # Helpers de chemins
├── package.json
├── vite.config.ts
└── README.md
```

## Architecture de l'interface

Le layout principal est `EditorLayout.tsx`.

Zones affichées :

| Zone | Rôle |
|---|---|
| TitleBar | Affiche le nom de l'application et les actions globales. |
| Fichiers | Affiche l'arborescence du workspace. |
| Code | Affiche les onglets ouverts et Monaco Editor. |
| Commandes utiles | Liste les commandes vocales disponibles. |
| Logs | Affiche l'historique des actions et appels backend. |
| Commande | Affiche l'écoute vocale, la commande comprise et la validation. |
| Console | Affiche stdout, stderr et code de retour après exécution. |

Fonctionnalités d'ergonomie :

- les panneaux peuvent être cachés ou réaffichés ;
- les séparations peuvent être redimensionnées ;
- les icônes de redimensionnement apparaissent au survol ;
- les tailles de panneaux permettent de donner plus de place au code ou à la console ;
- sur mobile/tablette, l'interface bascule vers une navigation par onglets.

## Connexion au backend

L'authentification est automatique pour faciliter la démonstration :

```text
login: admin.root
password: adminpwd
```

Flux attendu :

1. Le frontend appelle `POST /api/user/login`.
2. Le backend renvoie un JWT.
3. Le JWT est ajouté aux requêtes suivantes avec :

```text
Authorization: Bearer <token>
```

Une vraie page de connexion peut être ajoutée ensuite sans modifier les appels API principaux.

## Documentation technique des modules frontend

### `src/api/auth.ts`

| Fonction | Rôle | Résultat attendu | Erreurs identifiées |
|---|---|---|---|
| `login(loginName, password)` | Envoie les identifiants au backend. | Retourne un token JWT. | Lève `Échec de la connexion` si le backend refuse. |

### `src/api/client.ts`

| Fonction | Rôle | Résultat attendu | Erreurs identifiées |
|---|---|---|---|
| `apiFetch(path, init)` | Enrobe `fetch` et logue chaque appel backend. | Retourne la réponse HTTP brute. | Ne transforme pas l'erreur : les fonctions appelantes vérifient `response.ok`. |

### `src/api/files.ts`

| Fonction | Rôle | Résultat attendu | Erreurs identifiées |
|---|---|---|---|
| `listFolder(path, token)` | Liste le contenu direct d'un dossier. | Retourne des entrées triées : dossiers puis fichiers. | `Impossible de lister le dossier`. |
| `listAllFiles(path, token)` | Liste récursivement les fichiers. | Retourne une liste de chemins. | `Impossible de lister les fichiers`. |
| `readFile(path, token)` | Lit un fichier texte. | Retourne le contenu du fichier. | `Impossible de lire le fichier`. |
| `saveFile(path, content, token)` | Sauvegarde un fichier. | Écrit le contenu dans le backend. | `Impossible d'enregistrer le fichier`. |
| `createFile(path, token)` | Crée un fichier vide. | Fichier créé dans le workspace. | `Opération refusée par le serveur`. |
| `createFolder(path, token)` | Crée un dossier. | Dossier créé dans le workspace. | `Opération refusée par le serveur`. |
| `deleteFile(path, token)` | Supprime un fichier. | Fichier supprimé. | `Opération refusée par le serveur`. |
| `deleteFolder(path, token)` | Supprime un dossier. | Dossier et contenu supprimés. | `Opération refusée par le serveur`. |
| `moveFile(src, dst, token)` | Renomme ou déplace un fichier. | Fichier déplacé. | `Opération refusée par le serveur`. |
| `moveFolder(src, dst, token)` | Renomme ou déplace un dossier. | Dossier déplacé. | `Opération refusée par le serveur`. |
| `runPython(path, token)` | Exécute un fichier Python. | Retourne `stdout`, `stderr`, `exitCode`. | `Impossible d'exécuter le fichier`. |

### `src/lib/commands.ts`

| Fonction / élément | Rôle | Résultat attendu | Erreurs identifiées |
|---|---|---|---|
| `parseCommand(text)` | Transforme une phrase en commande structurée. | Retourne une commande ou `null`. | Commande non comprise. |
| `cleanName(raw)` | Nettoie un nom dicté. | Convertit par exemple `main point py` en `main.py`. | Nom vide si la phrase ne contient rien d'exploitable. |
| `cleanPath(raw)` | Nettoie un chemin dicté. | Convertit les phrases avec `dans dossier` en chemin relatif. | Peut produire un chemin vide si la commande est incomplète. |
| `translateSymbols(raw)` | Convertit les mots-symboles en code. | `supérieur à`, `égale`, `parenthèse ouvrante`, etc. deviennent des symboles. | Les mots inconnus restent du texte. |
| `parseCodeCommand(rawText)` | Reconnaît les commandes d'édition de code. | Retourne une commande d'insertion, déplacement curseur, remplacement ou suppression. | Retourne `null` si le motif ne correspond pas. |

### `src/pages/EditorPage.tsx`

| Fonction | Rôle | Résultat attendu | Erreurs identifiées |
|---|---|---|---|
| `openFile(file)` | Ouvre un fichier dans un onglet. | Ajoute l'onglet ou active l'onglet existant. | Aucun fichier ouvert si la lecture backend a échoué avant. |
| `closeTab(path)` | Ferme un onglet. | Active un autre onglet ou aucun. | Aucun. |
| `updateContent(path, content)` | Met à jour le contenu local d'un onglet. | Le contenu de l'éditeur change. | Aucun. |
| `markSaved(path)` | Marque un onglet comme sauvegardé. | `baseline` devient égal au contenu courant. | Aucun. |
| `saveActiveTab()` | Sauvegarde l'onglet actif si modifié. | Appel backend puis onglet marqué sauvegardé. | Échec si aucun token ou backend indisponible. |
| `deleteEntry(name)` | Supprime fichier ou dossier. | Essaie fichier puis dossier. | Échec si l'entrée n'existe pas. |
| `moveEntry(src, dst)` | Déplace fichier ou dossier. | Essaie fichier puis dossier. | Échec si source absente ou destination déjà existante. |
| `resolveFile(name)` | Résout un nom dicté vers un fichier. | Chemin exact ou meilleur match. | Retourne `null` si aucun fichier ne correspond. |
| `runCommand(command)` | Exécute une commande vocale validée. | Action réalisée + message de retour vocal. | Retourne un message d'erreur compréhensible si action impossible. |

## Endpoints utilisés

| Endpoint | Utilisation frontend |
|---|---|
| `POST /api/user/login` | Connexion automatique. |
| `GET /api/folders?path=...` | Affichage de l'arborescence. |
| `POST /api/folders` | Création d'un dossier. |
| `DELETE /api/folders` | Suppression d'un dossier. |
| `PUT /api/folders/move` | Déplacement ou renommage d'un dossier. |
| `GET /api/files?path=...` | Lecture d'un fichier. |
| `GET /api/files/all?path=...` | Recherche vocale et commande `liste`. |
| `POST /api/files` | Création d'un fichier. |
| `DELETE /api/files` | Suppression d'un fichier. |
| `POST /api/files/upload?path=...` | Sauvegarde d'un fichier. |
| `PUT /api/files/move` | Déplacement ou renommage d'un fichier. |
| `POST /api/exec` | Exécution Python. |

## Commandes vocales principales

La reconnaissance vocale utilise la Web Speech API en français (`fr-FR`). Elle fonctionne surtout sur Chrome et Edge.

### Gestion fichiers et dossiers

```text
crée un fichier main
crée un dossier tests
ouvre main
liste les fichiers
ouvre 1
supprime main.py
déplace main.py dans tests
dépli tests
repli tests
```

### Édition de code

```text
affiche bonjour
variable x égale 5
si x supérieur à 3
nouvelle ligne
indente
désindente
efface la ligne
va à la ligne 10
ligne 3 mot 2
modifie ligne 3 mot 2 par total
modifie ligne 3 mot 2 lettre 1 par T
supprime ligne 3 mot 2
supprime ligne 3 mot 2 lettre 1
```

### Exécution et sauvegarde

```text
enregistre
exécute le fichier courant
exécute main
ferme
```

## Résultats attendus côté utilisateur

| Action | Résultat visible attendu |
|---|---|
| Connexion | L'interface s'ouvre et les fichiers se chargent. |
| Chargement fichiers | L'arborescence s'affiche ou un message d'erreur apparaît. |
| Ouverture fichier | Un onglet apparaît dans la zone code. |
| Modification code | Le contenu change dans Monaco Editor. |
| Sauvegarde | Le fichier est envoyé au backend et l'onglet n'est plus considéré modifié. |
| Exécution | La console affiche stdout, stderr et exit code. |
| Commande vocale comprise | La commande est affichée et confirmée vocalement. |
| Commande vocale inconnue | Un message indique que la commande n'est pas comprise. |
| Erreur backend | Les logs affichent l'appel en échec et l'utilisateur voit un message. |
| Masquage panneau | Le panneau disparaît sans perdre l'état de l'application. |
| Réaffichage panneau | Le panneau revient avec son état précédent. |
| Redimensionnement | La zone déplacée change de taille sans masquer le contenu essentiel. |

## Responsive

Formats à tester avant soutenance :

| Format | Largeur |
|---|---:|
| Mobile | `375 px` |
| Tablette | `768 px` |
| Desktop | `1440 px` |

Points à vérifier :

- aucun débordement horizontal ;
- boutons toujours accessibles ;
- textes lisibles ;
- pas de chevauchement ;
- l'éditeur, la commande et la console restent utilisables.

## Accessibilité

Éléments déjà pris en compte :

- boutons HTML réels ;
- labels ARIA sur les boutons importants ;
- messages d'erreur visibles ;
- états de chargement ;
- boutons désactivés pendant certaines actions longues ;
- synthèse vocale ;
- interface adaptable par masquage et redimensionnement des panneaux.

À vérifier avec Axe DevTools sur au moins deux états de l'application :

1. état éditeur avec fichier ouvert ;
2. état commande/console après exécution ou erreur.

Objectif :

- `0` erreur Critical ;
- `0` erreur Serious ;
- le moins possible de problèmes Moderate ou Minor.

## Opérations asynchrones

Actions concernées :

- connexion ;
- chargement de l'arborescence ;
- création de fichier/dossier ;
- suppression ;
- déplacement ;
- sauvegarde ;
- exécution Python ;
- reconnaissance vocale.

Test recommandé :

```text
F12 → Network → No throttling → Slow 3G
```

L'utilisateur doit toujours comprendre :

- qu'une action est en cours ;
- qu'elle est terminée ;
- qu'elle a échoué.

## Erreurs connues et dépannage

### Erreur de chargement des fichiers

Vérifier :

1. backend lancé sur `8080` ;
2. frontend lancé sur `5173` ;
3. workspace existant ;
4. `FILESYSTEM_DEFAULT_PATH` défini côté backend ;
5. fichier de test présent dans le workspace ;
6. compte `admin.root / adminpwd` disponible ;
7. proxy Vite actif.

Commandes utiles :

```bash
curl http://localhost:8080/api/hello
ls -la "$HOME/ping-workspace"
```

### La commande vocale ne marche pas

- Utiliser Chrome ou Edge.
- Autoriser le micro.
- Vérifier que la page est servie par `localhost`.

### La sauvegarde échoue

- Vérifier que le backend accepte `POST /api/files/upload`.
- Vérifier que le fichier est dans le workspace.
- Vérifier les logs backend.

### L'exécution Python échoue

- Vérifier que le fichier se termine par `.py`.
- Vérifier que `python3` est disponible.
- Vérifier que le programme ne dépasse pas 5 secondes.

## Limites actuelles

- Pas de contrôle oculaire.
- Pas de vraie page de connexion obligatoire dans le flux de démonstration.
- Exécution limitée à Python.
- Reconnaissance vocale dépendante du navigateur.
- Les préférences de taille des panneaux ne sont pas forcément persistées après rechargement de la page.

## Évolutions possibles

- Ajouter une page de connexion complète.
- Persister les tailles et panneaux visibles dans le profil utilisateur.
- Ajouter un mode oculaire.
- Ajouter des raccourcis vocaux personnalisables.
- Ajouter d'autres langages d'exécution.
- Ajouter des tests frontend automatisés.
