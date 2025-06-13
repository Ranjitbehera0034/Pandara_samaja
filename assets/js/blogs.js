// File: assets/js/blogs.js

document.addEventListener("DOMContentLoaded", async () => {
  const blogList = document.getElementById("blog-list");
  blogList.innerHTML = "<p>Loading posts...</p>";

  try {
    const res = await fetch(`${API_BASE_URL}/api/posts`);
    const posts = await res.json();

    if (!posts.length) {
      blogList.innerHTML = "<p>No posts available.</p>";
      return;
    }

    blogList.innerHTML = "";
    posts.forEach(post => {
      const div = document.createElement("div");
      div.className = "blog-card";
      div.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <small>Posted on ${new Date(post.created_at).toLocaleDateString()}</small>
      `;
      blogList.appendChild(div);
    });
  } catch (err) {
    console.error("Error loading posts:", err);
    blogList.innerHTML = "<p>Failed to load posts.</p>";
  }
});
