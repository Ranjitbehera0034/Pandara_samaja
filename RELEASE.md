# 🏛️ Pandara Samaja Frontend — Release v1.0.0

**Release Date:** 2026-03-07  
**Tag:** `v1.0.0`  
**Type:** 🚀 Initial Production Release

---

## 🆕 What's New in v1.0.0

This is the first production release of the Nikhila Odisha Pandara Samaja digital platform.

### ✅ Public Website
- Community landing page with leader carousel
- Blog listing and announcement pages
- Fully responsive across desktop, tablet, and mobile

### ✅ Member Portal (`/portal`)
- Firebase OTP phone login
- User profile and HOF (Head of Family) management
- Community social feed — posts, likes, comments
- Leader directory with State / District / Taluka / Panchayat hierarchy
- Real-time notifications and messaging (Socket.io)
- Matrimony module:
  - Download blank matrimony form
  - Upload filled form for admin review
  - View approved candidates in the live directory

### ✅ Admin Panel (`/admin`)
- Secure login with JWT + MFA (TOTP / QR code)
- Member management and approval workflow with Excel export
- Leader CRUD with image upload
- Matrimony review queue — approve, reject, or request correction
- Admin direct matrimony upload (auto-approved candidates)
- Blog/post management
- Audit log for user activity

---

## 🛠️ Technical Highlights

- **Shared `imageUtils.ts`** — Single utility used by all components for Google Drive image URL resolution — change once, works everywhere
- **Scalable image serving** — Direct Google CDN (`lh3.googleusercontent.com`) URLs with graceful error fallback
- **Centralized `api.ts` services** — Both apps use consistent Axios service with auth token auto-injection
- **Responsive design** — Bottom sheets on mobile, modals on desktop throughout all major features
- **TypeScript** — Strict typing throughout both apps (zero `tsc` errors)

---

## 📦 Apps in This Release

| App | Framework | Entry Point |
|-----|-----------|-------------|
| Static site | HTML + Vanilla JS | `index.html` |
| Member Portal | React 19 + Vite + TypeScript | `portal-app/` |
| Admin Panel | React 19 + Vite + TypeScript | `admin-app/` |

---

## ⚙️ Breaking Changes

None — initial release.

---

## 🐛 Known Issues

- Image proxy via backend (`/api/v1/image-proxy/`) requires backend v1.0.0 deployment to be active. Currently bypassed using direct Google CDN links.

---

## 📋 Upgrade Notes

N/A — initial release.

---

## 🔗 Related

- [Backend Release v1.0.0](https://github.com/Ranjitbehera0034/Pandara_samaja_backend/releases/tag/v1.0.0)
- [Live Site](https://nikhilaodishapandarasamaja.in)
