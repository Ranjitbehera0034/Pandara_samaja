# 🏛️ Pandara Samaja — Frontend

<p align="center">
  <img src="assets/logo.png" alt="Pandara Samaja Logo" width="80" />
</p>

<p align="center">
  <strong>Official digital platform for the Nikhila Odisha Pandara Samaja community</strong><br/>
  A modern, mobile-first web platform serving members, community leaders, and administrators.
</p>

<p align="center">
  <a href="https://nikhilaodishapandarasamaja.in">🌐 Live Site</a> ·
  <a href="https://nikhilaodishapandarasamaja.in/portal">👥 Member Portal</a> ·
  <a href="https://nikhilaodishapandarasamaja.in/admin">🔒 Admin Panel</a>
</p>

---

## 📁 Repository Structure

```
Pandara_samaja/
├── index.html              # Public-facing landing page (static)
├── about.html              # About page (static)
├── blogs.html              # Blog listing (static)
├── assets/                 # Shared static assets (images, fonts, icons)
│
├── portal/                 # Built output for member portal (deployed)
├── portal-app/             # Member Portal — React + Vite (source)
│   └── src/
│       ├── pages/          # Leaders, Matrimony, Feed, Members, etc.
│       ├── components/     # Reusable UI components
│       ├── context/        # Auth, Language, Settings contexts
│       ├── services/       # Axios API service
│       └── utils/          # imageUtils, helpers
│
├── admin/                  # Built output for admin panel (deployed)
└── admin-app/              # Admin Panel — React + Vite (source)
    └── src/
        ├── pages/          # Dashboard, Members, Leaders, Matrimony, etc.
        ├── components/     # MatrimonyVerificationQueue, etc.
        ├── services/       # Axios API service with admin token
        └── utils/          # imageUtils (shared pattern)
```

---

## 🚀 Features

### 🌐 Public Website
- Community landing page with leader showcase
- Blog and announcement section
- Responsive across all devices

### 👥 Member Portal (`/portal`)
- Firebase OTP phone authentication
- Member profile management
- Community feed (posts, likes, comments)
- Leader directory (State → District → Taluka → Panchayat)
- **Matrimony module** — download blank form, upload filled form for review
- Real-time messaging and notifications (Socket.io)

### 🔒 Admin Panel (`/admin`)
- Secure login with JWT + MFA (TOTP / QR Code)
- Member management (view, approve, export)
- Leader directory CRUD with image uploads
- **Matrimony review queue** — approve / reject / request correction
- Admin direct matrimony upload (bypasses queue for direct candidate creation)
- Audit log for user activity
- Blog and post management

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 7 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Routing | React Router v7 |
| Auth (Portal) | Firebase Phone Auth (OTP) |
| Real-time | Socket.io Client |
| Toast notifications | Sonner |
| HTTP Client | Axios |
| Linting | ESLint + TypeScript-ESLint |

---

## 🔧 Local Development

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- Backend running at `http://localhost:5000` (see [backend repo](https://github.com/Ranjitbehera0034/Pandara_samaja_backend))

### Setup

```bash
# Clone the repo
git clone https://github.com/Ranjitbehera0034/Pandara_samaja.git
cd Pandara_samaja
```

#### Run Member Portal
```bash
cd portal-app
npm install
npm run dev          # Starts at http://localhost:5173
```

#### Run Admin Panel
```bash
cd admin-app
npm install
npm run dev          # Starts at http://localhost:5174
```

#### Serve Static Site
```bash
# From root
npx serve -l 3000    # Serves index.html at http://localhost:3000
```

### Environment Variables

Both `portal-app` and `admin-app` pick up `VITE_API_URL` from a `.env` file:

```env
# portal-app/.env  /  admin-app/.env
VITE_API_URL=http://localhost:5000/api/v1
```

If not set, both apps auto-detect whether they are running locally or in production.

---

## 🏗️ Build & Deploy

```bash
# Build member portal
cd portal-app && npm run build
# Output: portal-app/dist/ → copy contents to /portal/

# Build admin panel
cd admin-app && npm run build
# Output: admin-app/dist/ → copy contents to /admin/
```

The static files in `/portal` and `/admin` are served by GitHub Pages via the `CNAME` file.

---

## 📡 Backend API

This frontend connects to:

| Environment | URL |
|-------------|-----|
| Production | `https://pandara-samaja-backend.onrender.com/api/v1` |
| Local | `http://localhost:5000/api/v1` |

See the [Backend Repository](https://github.com/Ranjitbehera0034/Pandara_samaja_backend) for full API documentation.

---

## 🖼️ Image Handling

All Google Drive image URLs are processed via `src/utils/imageUtils.ts` — a single shared utility used across all components in both apps. This converts `drive.google.com/uc?id=...` links to direct `lh3.googleusercontent.com/d/...` CDN URLs for fast, reliable delivery.

---

## 📄 License

MIT © Nikhila Odisha Pandara Samaja
