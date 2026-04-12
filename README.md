# Rahman Research Lab — Full Stack Website

A complete research lab website built with **React + TypeScript + Firebase + Cloudinary**. Features a public-facing site, an admin dashboard, and a collaborator portal — all backed by Firestore and Firebase Authentication.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS + CSS Variables |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Media | Cloudinary (drag & drop + URL) |
| Routing | React Router v6 |
| Hosting | Firebase Hosting (recommended) |

---

## Project Structure

```
rahmanlab/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── firestore.rules
├── .env.example
├── README.md
├── scripts/
│   └── firestore-seed.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── index.ts
    ├── firebase/
    │   ├── config.ts
    │   └── hooks.ts
    ├── context/
    │   ├── AuthContext.tsx
    │   └── ThemeContext.tsx
    ├── components/
    │   ├── Navbar.tsx
    │   ├── Footer.tsx
    │   ├── CollaboratorCard.tsx
    │   ├── IdeaCard.tsx
    │   ├── CommentSection.tsx
    │   ├── PublicationCard.tsx
    │   ├── ContactForm.tsx
    │   ├── CloudinaryUpload.tsx
    │   └── ProtectedRoute.tsx
    ├── pages/
    │   ├── Home.tsx
    │   ├── About.tsx
    │   ├── Collaborators.tsx
    │   ├── Publications.tsx
    │   ├── ResearchIdeas.tsx
    │   ├── IdeaDetail.tsx
    │   ├── Contact.tsx
    │   └── Login.tsx
    ├── portals/
    │   ├── AdminDashboard.tsx
    │   └── CollaboratorPortal.tsx
    └── admin/
        ├── ContentEditor.tsx
        ├── ThemeControl.tsx
        ├── CollaboratorRequests.tsx
        ├── ManageCollaborators.tsx
        ├── ManagePublications.tsx
        └── AdminSections.tsx
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Firebase](https://console.firebase.google.com) project
- A [Cloudinary](https://cloudinary.com) account

### 1. Clone and Install

```bash
git clone https://github.com/your-username/rahmanlab.git
cd rahmanlab
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) → **Create a project**
2. Enable **Authentication** → Sign-in method → **Email/Password**
3. Enable **Firestore Database** → Start in **production mode**
4. Register a **Web App** → Copy the config keys
5. Deploy Firestore security rules:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules
```

### 3. Set Up Cloudinary

1. Log in to [Cloudinary](https://cloudinary.com)
2. Go to **Settings** → **Upload** → **Add upload preset**
3. Set the preset mode to **Unsigned**
4. Note your **Cloud Name** and **Upload Preset** name

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Fill in your own values in `.env`. Refer to `.env.example` for the full list of required keys. **Never commit your `.env` file** — it is already listed in `.gitignore`.

### 5. Seed the Database

A seed script is provided to populate Firestore with initial content and user accounts for local development.

```bash
npm install -D ts-node
```

Download your Firebase service account key from **Firebase Console → Project Settings → Service Accounts → Generate New Private Key**, save it as `scripts/serviceAccount.json`, then run:

```bash
npx ts-node --esm scripts/firestore-seed.ts
```

> ⚠️ `scripts/serviceAccount.json` is excluded from version control. Never commit it.

After seeding, login credentials for local development accounts are defined inside the seed script itself.

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## User Roles & Access

| Role | Login | Capabilities |
|---|---|---|
| **Admin** | `/login` | Full dashboard — content, theme, users, publications, ideas, messages |
| **Collaborator** | `/login` | Edit own profile, post research ideas, comment on ideas |
| **Visitor** | — | Browse all public pages, submit contact form, submit collaborator request |

---

## Pages & Routes

| Route | Description |
|---|---|
| `/` | Home page |
| `/about` | About the lab |
| `/collaborators` | Collaborator grid + request form |
| `/publications` | Publications (ongoing + published) |
| `/research-ideas` | Research ideas list |
| `/research-ideas/:id` | Idea detail + comments |
| `/contact` | Contact form |
| `/login` | Admin & collaborator login |
| `/admin` | Admin dashboard *(admin only)* |
| `/collaborator-portal` | Collaborator self-service *(collaborator only)* |

---

## Admin Dashboard

| Section | Description |
|---|---|
| **Content Editor** | Edit all site text across every page tab |
| **Theme Control** | Change colors and fonts with live preview; 5 preset palettes included |
| **Announcements** | Add or remove homepage announcements |
| **Collab Requests** | Review, approve, or reject pending collaborator requests |
| **Collaborators** | Edit any profile, toggle visibility, or remove collaborators |
| **Publications** | Add, edit, or delete ongoing and published research entries |
| **Research Ideas** | View all ideas and comments; delete any entry |
| **Contact Messages** | Read messages, mark as read, reply via email, or delete |

---

## Collaborator Request Flow

1. A visitor navigates to `/collaborators` and clicks **Submit Collaborator Request**
2. They complete the form (name, email, password, photo, affiliation, bio, research interests, social links, publications)
3. The request is saved to the `pendingRequests` Firestore collection
4. The admin reviews the request in the **Collab Requests** dashboard section
5. On approval, a Firebase Auth account is created and the collaborator profile becomes visible
6. The collaborator logs in at `/login` and is redirected to `/collaborator-portal`

---

## Firestore Collections

| Collection | Description |
|---|---|
| `siteContent` | Key-value store for all editable site text |
| `theme` | Single document containing all CSS variable values |
| `users` | UID → `{ name, email, role }` |
| `collaborators` | Collaborator profiles including publications array |
| `publications` | Lab publications with `type: ongoing \| published` |
| `researchIdeas` | Ideas posted by collaborators |
| `comments` | Comments on research ideas |
| `announcements` | Homepage announcement items |
| `pendingRequests` | Collaborator join requests awaiting admin review |
| `contactMessages` | Contact form submissions |

---

## Environment Variables Reference

All variables are prefixed with `VITE_` so Vite exposes them to the browser. See `.env.example` for the complete list.

| Variable | Where to Get It |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your Apps → Web |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | Same as above |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same as above |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same as above |
| `VITE_FIREBASE_APP_ID` | Same as above |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary Dashboard → top-right corner |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary → Settings → Upload → Upload Presets |

---

## Deployment

### Firebase Hosting

```bash
npm run build

firebase init hosting
# Public directory     → dist
# Single-page app      → Yes
# Overwrite index.html → No

firebase deploy
```

---

## Customisation

- **Edit site text** — Admin Dashboard → **Content Editor** → select tab → edit field → Save
- **Change theme** — Admin Dashboard → **Theme Control** → pick a preset or use color pickers → Apply
- **Add a content field** — Add the key to `FIELD_GROUPS` in `src/admin/ContentEditor.tsx`, then read it in the relevant page via `content['your.key']`
- **Add a new page** — Create the file in `src/pages/`, register the route in `App.tsx`, add the nav link in `Navbar.tsx`, and add content fields in `ContentEditor.tsx`
- **Change default theme colors** — Update the `:root` block in `src/index.css`

---

## Security Notes

- Never commit `.env` or `scripts/serviceAccount.json` — both are excluded via `.gitignore`
- Rotate your Firebase and Cloudinary credentials immediately if they are ever accidentally exposed
- Review and tighten `firestore.rules` before going to production

---

## License

This project is for academic and research use. Please contact the lab before redistributing or adapting this codebase.
