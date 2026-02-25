# Pandara Samaja — Full Social Media Platform Roadmap

This roadmap outlines the features to build Pandara Samaja Portal into a complete social media application (like Instagram + Facebook + Twitter + Snapchat) for the community.

---

## ✅ COMPLETED FEATURES

### Core Social Feed
- [x] **Activity Feed** — Post text content with rich UI
- [x] **Multi-Image Upload** — Carousel/grid for multiple photos per post
- [x] **Like & Comment** — Interactive reactions and threaded comments
- [x] **Stories** — 24-hour disappearing photos/videos (Instagram-style) with auto-advance
- [x] **Create Post** — Rich post creation with image previews
- [x] **Real-time Feed** — Socket.io integration for live post/like/comment updates

### Communication
- [x] **Direct Messaging** — 1-on-1 real-time chat with Socket.io
- [x] **Online Status** — Active now / Last seen indicators
- [x] **Connection Status** — Visual online/offline indicator in chat

### Member Management
- [x] **Login / Auth** — Membership number + mobile login with JWT
- [x] **Logout** — Header + sidebar logout with redirect
- [x] **Member Directory** — View all community members
- [x] **Photo Gallery** — Community photo gallery

### Profile & Family (NEW ✨)
- [x] **Profile Page** — View/edit personal details with cover photo
- [x] **Family Members** — Add/edit/remove family members from profile
- [x] **Profile Photo Upload** — Camera icon overlay for photo change
- [x] **Notifications Center** — Filter, mark read, delete notifications

### Navigation & Layout
- [x] **Responsive Sidebar** — Mobile hamburger menu + desktop sidebar
- [x] **Search Bar** — Global search in header (UI ready)
- [x] **Explore Link** — Discovery page placeholder

---

## 🔧 IN PROGRESS — Phase by Phase

### Phase 1: Enhanced Interactions ✅
- [x] **Video Uploads** — Standard video posts with playback controls (play/pause/mute)
- [x] **Rich Reactions** — Like 👍, Love ❤️, Haha 😂, Wow 😮, Sad 😢, Angry 😡 (Facebook-style)
- [x] **Nested Comments** — Reply to specific comments (threaded, 2 levels deep)
- [x] **Mentions & Hashtags** — @User tags (purple) and #Topic (blue) highlighting
- [ ] **Link Previews** — Automatic preview cards for shared URLs
- [x] **Post Sharing / Repost** — Share others' posts with share count
- [x] **Save / Bookmark Posts** — Personal collections with bookmark state
- [x] **Delete / Edit Posts** — Author can manage their own posts

### Phase 2: Engagement & Ephemeral Content ✅
- [x] **Reels / Shorts** — Full-screen vertical short-form videos with swipe, double-tap like, mute
- [x] **Status Updates** — Quick text-based mood/status with gradient cards and emoji picker
- [x] **Polls & Questions** — Interactive poll widgets embedded in posts with animated results
- [x] **Story Text Overlays** — Add text with position/color controls on story images

### Phase 3: Advanced Communication ✅
- [x] **Group Chat** — Create groups, member selection UI, custom group chats
- [x] **Push Notifications** — Browser Notification API integration with desktop alerts
- [x] **Audio/Video Calls** — In-app calling UI simulation (ringing, active call state)
- [x] **Voice Messages** — MediaRecorder API integration with audio playback
- [x] **Message Reactions** — Hover/double-click triggered emoji reactions on chat messages

### Phase 4: Community & Discovery ✅
- [x] **Explore Feed** — Trending posts, popular members algorithm
- [x] **Global Search** — Unified search for People, Posts, Hashtags
- [x] **Groups / Communities** — Sub-groups for interests or regions
- [x] **Events** — Event management with RSVPs and calendar
- [x] **User Profiles (Public)** — View another member's profile + posts

### Phase 5: Mobile & Advanced ✅
- [x] **Live Streaming** — Broadcast video from mobile/web with chat overlay
- [x] **Image Filters & Editing** — In-app cropping and filters
- [x] **Location Services** — Check-ins and map view of community posts
- [x] **Verified Badges** — Community leader checkmarks
- [x] **Dark / Light Theme** — User preference toggle
- [x] **PWA (Progressive Web App)** — Install on phone like native app

### Phase 6: Family-Specific Features ✅
- [x] **Family Login** — Family members can login with their own credentials
- [x] **Family Tree View** — Visual tree of family relationships
- [x] **Family Photo Albums** — Shared albums within a family
- [x] **Family Events** — Private events for family celebrations

---

## Suggested Next Steps
1. **Video Uploads** — Extend the current image upload to support video
2. **Rich Reactions** — Replace simple Like with emoji reactions
3. **Explore Feed** — Make `/explore` a real discovery page
4. **Group Chat** — Extend DM to group conversations
5. **Live Streaming** — Broadcast from phone with chat overlay
