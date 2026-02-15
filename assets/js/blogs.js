// File: assets/js/blogs.js

// Helper function to get auth headers with JWT token
function getAuthHeaders() {
  const token = localStorage.getItem("adminToken");
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

document.addEventListener("DOMContentLoaded", async () => {
  const blogList = document.getElementById("blog-list");
  blogList.innerHTML = "<p>Loading posts...</p>";

  try {
    const res = await fetch(`${API_BASE_URL}/api/posts`);
    const posts = await res.json();

    if (!posts.length) {
      blogList.innerHTML = `
        <div style="text-align:center; padding:3rem 1.5rem;">
          <p style="font-size:2.5rem; margin-bottom:0.5rem;">📝</p>
          <h3 style="color:#0a4a96; margin-bottom:0.5rem;">ଲେଖା ଶୀଘ୍ର ପ୍ରକାଶିତ ହେବ</h3>
          <p style="font-size:0.95rem; color:#475569;">Articles and announcements will be published soon.</p>
          <p style="font-size:0.85rem; margin-top:0.5rem; opacity:0.7;">Check back later for community news and updates.</p>
        </div>`;
      return;
    }

    blogList.innerHTML = "";
    const isAdmin = localStorage.getItem("isAdmin") === "true";

    posts.forEach(post => {
      const div = document.createElement("div");
      div.className = "blog-card";

      // Escape content for safe HTML rendering
      const escapedTitle = escapeHtml(post.title);
      const escapedContent = escapeHtml(post.content);

      div.innerHTML = `
        <h3>${escapedTitle}</h3>
        <p>${escapedContent}</p>
        <small>Posted on ${new Date(post.created_at).toLocaleDateString()}</small>
        ${isAdmin ? `
          <div class="admin-actions" style="display:flex; gap:10px; margin-top:10px;">
            <button class="edit-post-btn" data-id="${post.id}" data-title="${escapedTitle}" data-content="${escapedContent}" style="display:block; background:#ffc107; color:#000; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Edit</button>
            <button class="delete-post-btn" data-id="${post.id}" style="display:block; background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
          </div>
        ` : ''}
      `;
      blogList.appendChild(div);
    });

    // Admin event handlers
    if (isAdmin) {
      // Delete button handlers
      document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.target.dataset.id;
          if (confirm("Delete this post?")) {
            try {
              const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders()
              });
              if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Failed to delete: ${errorText}`);
              }
              e.target.closest('.blog-card').remove();
              showToast("Post deleted successfully!");
            } catch (err) {
              console.error("Error deleting post:", err);
              alert("Failed to delete post: " + err.message);
            }
          }
        });
      });

      // Edit button handlers
      document.querySelectorAll('.edit-post-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          const title = e.target.dataset.title;
          const content = e.target.dataset.content;

          // Show edit modal
          showEditModal(id, title, content);
        });
      });
    }
  } catch (err) {
    console.error("Error loading posts:", err);
    blogList.innerHTML = `
      <div style="text-align:center; padding:3rem 1.5rem;">
        <p style="font-size:2.5rem; margin-bottom:0.5rem;">📝</p>
        <h3 style="color:#0a4a96; margin-bottom:0.5rem;">ଲେଖା ଶୀଘ୍ର ପ୍ରକାଶିତ ହେବ</h3>
        <p style="font-size:0.95rem; color:#475569;">Articles and community news will be published here soon.</p>
        <p style="font-size:0.85rem; margin-top:0.5rem; opacity:0.7;">Stay tuned for updates from Nikhila Odisha Pandara Samaja.</p>
      </div>`;
  }
});

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${type === 'success' ? '#28a745' : '#dc3545'};
    color: white;
    border-radius: 4px;
    z-index: 9999;
    animation: fadeIn 0.3s ease;
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// Show edit modal
function showEditModal(id, title, content) {
  // Remove existing modal if any
  const existingModal = document.getElementById('edit-post-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'edit-post-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;

  modal.innerHTML = `
    <div style="background: white; padding: 30px; border-radius: 8px; width: 90%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
      <h2 style="margin-top:0; margin-bottom:20px;">Edit Post</h2>
      <form id="edit-post-form">
        <div style="margin-bottom: 15px;">
          <label style="display:block; margin-bottom:5px; font-weight:bold;">Title</label>
          <input type="text" id="edit-title" value="${escapeHtml(title)}" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box;">
        </div>
        <div style="margin-bottom: 15px;">
          <label style="display:block; margin-bottom:5px; font-weight:bold;">Content</label>
          <textarea id="edit-content" rows="5" required style="width:100%; padding:10px; border:1px solid #ddd; border-radius:4px; box-sizing:border-box; resize:vertical;">${escapeHtml(content)}</textarea>
        </div>
        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button type="button" id="cancel-edit" style="padding:10px 20px; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Cancel</button>
          <button type="submit" style="padding:10px 20px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Save Changes</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal on cancel
  document.getElementById('cancel-edit').addEventListener('click', () => {
    modal.remove();
  });

  // Close modal on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Handle form submit
  document.getElementById('edit-post-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const newTitle = document.getElementById('edit-title').value.trim();
    const newContent = document.getElementById('edit-content').value.trim();

    if (!newTitle || !newContent) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ title: newTitle, content: newContent })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update: ${errorText}`);
      }

      modal.remove();
      showToast("Post updated successfully!");

      // Reload the page to show updated content
      setTimeout(() => location.reload(), 500);
    } catch (err) {
      console.error("Error updating post:", err);
      alert("Failed to update post: " + err.message);
    }
  });
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(20px); }
  }
`;
document.head.appendChild(style);