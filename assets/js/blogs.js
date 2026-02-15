// File: assets/js/blogs.js — Premium Redesign

let allPosts = [];
let displayedPosts = [];

function getAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

/* ─── Skeleton Loading ─── */
function showSkeleton() {
  const blogList = document.getElementById('blog-list');
  blogList.innerHTML = `
    <div class="blog-skeleton-grid" style="grid-column:1/-1; display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.5rem;">
      ${Array(6).fill('').map(() => `
        <div class="blog-skeleton">
          <div class="blog-skeleton-bar"></div>
          <div class="blog-skeleton-body">
            <div class="blog-skeleton-tag"></div>
            <div class="blog-skeleton-title"></div>
            <div class="blog-skeleton-title-2"></div>
            <div class="blog-skeleton-line"></div>
            <div class="blog-skeleton-line"></div>
            <div class="blog-skeleton-line"></div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

/* ─── Toast ─── */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `blog-toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/* ─── Format Date ─── */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { or: 'ଆଜି', en: 'Today' };
  if (diffDays === 1) return { or: 'ଗତକାଲି', en: 'Yesterday' };
  if (diffDays < 7) return { or: `${diffDays} ଦିନ ପୂର୍ବେ`, en: `${diffDays} days ago` };
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return { or: `${weeks} ସପ୍ତାହ ପୂର୍ବେ`, en: `${weeks} week${weeks > 1 ? 's' : ''} ago` };
  }
  return {
    or: d.toLocaleDateString('or-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    en: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  };
}

/* ─── Estimate reading time ─── */
function readTime(content) {
  const words = (content || '').split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return { or: `${mins} ମିନିଟ୍`, en: `${mins} min read` };
}

/* ─── Render Posts ─── */
function renderPosts(posts) {
  const blogList = document.getElementById('blog-list');
  const countEl = document.getElementById('blogCount');
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  displayedPosts = posts;

  if (countEl) {
    countEl.innerHTML = `
      <span class="lang-or">${posts.length} ଟି ଲେଖା</span>
      <span class="lang-en">${posts.length} article${posts.length !== 1 ? 's' : ''}</span>`;
  }

  if (!posts.length) {
    blogList.innerHTML = `
      <div class="blog-empty">
        <div class="blog-empty-icon">📝</div>
        <h3>
          <span class="lang-or">ଲେଖା ଶୀଘ୍ର ପ୍ରକାଶିତ ହେବ</span>
          <span class="lang-en">Articles Coming Soon</span>
        </h3>
        <p>
          <span class="lang-or">ସମାଜର ଖବର ଓ ଘୋଷଣା ଶୀଘ୍ର ଏଠାରେ ପ୍ରକାଶିତ ହେବ</span>
          <span class="lang-en">Community news and announcements will be published here soon</span>
        </p>
        <p style="opacity:0.6; font-size:0.85rem;">
          <span class="lang-or">ଦୟାକରି ପରେ ଆସନ୍ତୁ</span>
          <span class="lang-en">Check back later for updates</span>
        </p>
      </div>`;
    return;
  }

  blogList.innerHTML = '';

  posts.forEach((post, index) => {
    const escapedTitle = escapeHtml(post.title);
    const escapedContent = escapeHtml(post.content);
    const date = formatDate(post.created_at);
    const rt = readTime(post.content);
    const id = post.id || post._id;

    const card = document.createElement('div');
    card.className = 'blog-card';
    card.dataset.postIndex = index;
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';

    let adminHtml = '';
    if (isAdmin) {
      adminHtml = `
        <div class="blog-admin-actions">
          <button class="blog-admin-btn edit" data-id="${id}" data-title="${escapedTitle}" data-content="${escapedContent}">
            ✏️ <span class="lang-or">ସମ୍ପାଦନା</span><span class="lang-en">Edit</span>
          </button>
          <button class="blog-admin-btn delete" data-id="${id}">
            🗑️ <span class="lang-or">ବିଲୋପ</span><span class="lang-en">Delete</span>
          </button>
        </div>`;
    }

    card.innerHTML = `
      <div class="blog-card-bar"></div>
      <div class="blog-card-body">
        <div class="blog-card-category">
          📢
          <span class="lang-or">ଘୋଷଣା</span>
          <span class="lang-en">Announcement</span>
        </div>
        <h3>${escapedTitle}</h3>
        <div class="blog-card-content">${escapedContent}</div>
      </div>
      ${adminHtml}
      <div class="blog-card-footer">
        <div class="blog-card-date">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span class="lang-or">${date.or}</span>
          <span class="lang-en">${date.en}</span>
        </div>
        <div class="blog-card-read">
          <span class="lang-or">ପଢ଼ନ୍ତୁ →</span>
          <span class="lang-en">Read →</span>
        </div>
      </div>`;

    // Click to open reader
    card.addEventListener('click', (e) => {
      if (e.target.closest('.blog-admin-btn') || e.target.closest('.blog-admin-actions')) return;
      openReader(index);
    });

    blogList.appendChild(card);

    // Stagger entrance animation
    setTimeout(() => {
      card.style.transition = 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 80);
  });

  // Attach admin event handlers
  if (isAdmin) {
    blogList.querySelectorAll('.blog-admin-btn.delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const delId = btn.dataset.id;
        if (confirm("Delete this post?")) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${delId}`, {
              method: "DELETE",
              headers: getAuthHeaders()
            });
            if (!res.ok) throw new Error(await res.text());
            btn.closest('.blog-card').remove();
            allPosts = allPosts.filter(p => (p.id || p._id) !== delId);
            showToast("Post deleted!", "success");
            updateCount();
          } catch (err) {
            showToast("Delete failed: " + err.message, "error");
          }
        }
      });
    });

    blogList.querySelectorAll('.blog-admin-btn.edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showEditModal(btn.dataset.id, btn.dataset.title, btn.dataset.content);
      });
    });
  }
}

/* ═══ Reading Modal ═══ */
let currentReaderIndex = -1;

function openReader(index) {
  const posts = displayedPosts;
  if (index < 0 || index >= posts.length) return;
  currentReaderIndex = index;

  const post = posts[index];
  const date = formatDate(post.created_at);
  const rt = readTime(post.content);
  const fullDate = new Date(post.created_at).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // Format content into paragraphs
  const bodyHtml = (post.content || '').split(/\n+/).filter(Boolean).map(p => `<p>${escapeHtml(p)}</p>`).join('')
    || `<p>${escapeHtml(post.content)}</p>`;

  // Remove existing overlay
  const existing = document.querySelector('.blog-reader-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'blog-reader-overlay';
  document.body.style.overflow = 'hidden';

  overlay.innerHTML = `
    <div class="blog-reader">
      <div class="blog-reader-bar"></div>
      <button class="blog-reader-close" title="Close">✕</button>

      <div class="blog-reader-content">
        <div class="blog-reader-category">
          📢
          <span class="lang-or">ଘୋଷଣା</span>
          <span class="lang-en">Announcement</span>
        </div>

        <h2 class="blog-reader-title">${escapeHtml(post.title)}</h2>

        <div class="blog-reader-meta">
          <div class="blog-reader-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            ${fullDate}
          </div>
          <div class="blog-reader-meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="6" x2="12" y2="12"/>
              <line x1="12" y1="12" x2="16" y2="14"/>
            </svg>
            <span class="lang-or">${rt.or}</span>
            <span class="lang-en">${rt.en}</span>
          </div>
        </div>

        <div class="blog-reader-body">
          ${bodyHtml}
        </div>
      </div>

      <div class="blog-reader-footer">
        <button class="blog-reader-share" id="readerShare">
          📤
          <span class="lang-or">ସେୟାର</span>
          <span class="lang-en">Share</span>
        </button>

        <div class="blog-reader-nav">
          <button class="blog-reader-nav-btn" id="readerPrev" title="Previous" ${index <= 0 ? 'disabled' : ''}>←</button>
          <span style="font-size:0.78rem; color:var(--blog-text-muted); align-self:center; font-weight:600;">${index + 1} / ${posts.length}</span>
          <button class="blog-reader-nav-btn" id="readerNext" title="Next" ${index >= posts.length - 1 ? 'disabled' : ''}>→</button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  // Close handlers
  overlay.querySelector('.blog-reader-close').addEventListener('click', closeReader);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeReader(); });

  // Navigation
  overlay.querySelector('#readerPrev').addEventListener('click', () => openReader(currentReaderIndex - 1));
  overlay.querySelector('#readerNext').addEventListener('click', () => openReader(currentReaderIndex + 1));

  // Share
  overlay.querySelector('#readerShare').addEventListener('click', async () => {
    const shareData = { title: post.title, text: post.content?.substring(0, 120) + '...', url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied!', 'success');
    }
  });

  // Scroll reader to top
  overlay.scrollTop = 0;
}

function closeReader() {
  const overlay = document.querySelector('.blog-reader-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.25s ease';
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = '';
    }, 250);
  }
  currentReaderIndex = -1;
}

// Keyboard support
document.addEventListener('keydown', (e) => {
  if (currentReaderIndex < 0) return;
  if (e.key === 'Escape') closeReader();
  if (e.key === 'ArrowLeft' && currentReaderIndex > 0) openReader(currentReaderIndex - 1);
  if (e.key === 'ArrowRight' && currentReaderIndex < displayedPosts.length - 1) openReader(currentReaderIndex + 1);
});

function updateCount() {
  const countEl = document.getElementById('blogCount');
  const visible = document.querySelectorAll('.blog-card').length;
  if (countEl) {
    countEl.innerHTML = `
      <span class="lang-or">${visible} ଟି ଲେଖା</span>
      <span class="lang-en">${visible} article${visible !== 1 ? 's' : ''}</span>`;
  }
}

/* ─── Search ─── */
function setupSearch() {
  const input = document.getElementById('blogSearch');
  if (!input) return;

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (!q) {
      renderPosts(allPosts);
      return;
    }
    const filtered = allPosts.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.content || '').toLowerCase().includes(q)
    );
    renderPosts(filtered);
  });
}

/* ─── Filter Tabs ─── */
function setupFilters() {
  document.querySelectorAll('.blog-filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.blog-filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.dataset.filter;
      let sorted = [...allPosts];

      if (filter === 'recent') {
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (filter === 'oldest') {
        sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      }

      // Clear search
      const input = document.getElementById('blogSearch');
      if (input) input.value = '';

      renderPosts(sorted);
    });
  });
}

/* ─── Edit Modal ─── */
function showEditModal(id, title, content) {
  const existing = document.getElementById('blog-edit-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'blog-edit-overlay';
  overlay.className = 'blog-edit-overlay';

  overlay.innerHTML = `
    <div class="blog-edit-modal">
      <h2>
        <span class="lang-or">ଲେଖା ସମ୍ପାଦନା</span>
        <span class="lang-en">Edit Post</span>
      </h2>
      <form id="blog-edit-form">
        <label class="blog-edit-label">
          <span class="lang-or">ଶୀର୍ଷକ</span>
          <span class="lang-en">Title</span>
        </label>
        <input type="text" id="edit-title" class="blog-edit-input" value="${escapeHtml(title)}" required>

        <label class="blog-edit-label">
          <span class="lang-or">ବିଷୟବସ୍ତୁ</span>
          <span class="lang-en">Content</span>
        </label>
        <textarea id="edit-content" class="blog-edit-textarea" rows="5" required>${escapeHtml(content)}</textarea>

        <div class="blog-edit-actions">
          <button type="button" id="cancel-edit" class="blog-edit-btn cancel">
            <span class="lang-or">ବାତିଲ</span>
            <span class="lang-en">Cancel</span>
          </button>
          <button type="submit" class="blog-edit-btn save">
            <span class="lang-or">ସଂରକ୍ଷଣ</span>
            <span class="lang-en">Save Changes</span>
          </button>
        </div>
      </form>
    </div>`;

  document.body.appendChild(overlay);

  document.getElementById('cancel-edit').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('blog-edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newTitle = document.getElementById('edit-title').value.trim();
    const newContent = document.getElementById('edit-content').value.trim();
    if (!newTitle || !newContent) return showToast("Fill all fields", "error");

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: newTitle, content: newContent })
      });
      if (!res.ok) throw new Error(await res.text());
      overlay.remove();
      showToast("Post updated!", "success");
      setTimeout(() => location.reload(), 500);
    } catch (err) {
      showToast("Update failed: " + err.message, "error");
    }
  });
}

/* ─── Init ─── */
document.addEventListener("DOMContentLoaded", async () => {
  const blogList = document.getElementById("blog-list");
  showSkeleton();

  try {
    const res = await fetch(`${API_BASE_URL}/api/posts`);
    const posts = await res.json();

    allPosts = posts;
    renderPosts(posts);
    setupSearch();
    setupFilters();

  } catch (err) {
    console.error("Error loading posts:", err);
    blogList.innerHTML = `
      <div class="blog-empty">
        <div class="blog-empty-icon">📝</div>
        <h3>
          <span class="lang-or">ଲେଖା ଶୀଘ୍ର ପ୍ରକାଶିତ ହେବ</span>
          <span class="lang-en">Articles Coming Soon</span>
        </h3>
        <p>
          <span class="lang-or">ସମାଜର ଖବର ଓ ଘୋଷଣା ଶୀଘ୍ର ଏଠାରେ ପ୍ରକାଶିତ ହେବ</span>
          <span class="lang-en">Community news and announcements will be published here soon</span>
        </p>
        <p style="opacity:0.6; font-size:0.85rem;">
          <span class="lang-or">ନିଖିଳ ଓଡିଶା ପନ୍ଦରା ସମାଜ ସହ ଯୋଡ଼ି ରୁହନ୍ତୁ</span>
          <span class="lang-en">Stay connected with Nikhila Odisha Pandara Samaja</span>
        </p>
      </div>`;
  }
});