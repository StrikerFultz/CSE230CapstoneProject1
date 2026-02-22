const API_BASE = 'http://localhost:5000/api';

// checks if user is authenticated
// options: requireRole and redirect
export async function checkAuth(options = {}) {
  const { requireRole = null, redirect = 'login.html' } = options;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });

    if (!res.ok) {
      window.location.href = redirect;
      return null;
    }

    const data = await res.json();
    const user = data.user;

    // Check role if required
    if (requireRole) {
      const allowed = Array.isArray(requireRole) ? requireRole : [requireRole];
      if (!allowed.includes(user.role)) {
        window.location.href = 'index.html';
        return null;
      }
    }

    // Update nav based on role
    updateNav(user);

    return user;

  } catch (err) {
    console.warn('Auth check failed:', err);
    window.location.href = redirect;
    return null;
  }
}

// Update navigation bar based on user role.
// Hides "Professor View" for students and adds user info

function updateNav(user) {
  // hide professor view link for students
  const navLinks = document.querySelectorAll('.nav a');
  navLinks.forEach(link => {
    if (link.getAttribute('href') === 'teacher.html' && user.role === 'student') {
      link.style.display = 'none';
    }
  });

  // add user info and logout to nav if not already there
  const nav = document.querySelector('.nav');
  if (nav && !document.getElementById('nav-user-info')) {
    const userSpan = document.createElement('span');

    userSpan.id = 'nav-user-info';
    userSpan.style.cssText = 'font-size: 12px; color: #555; padding: 3px 8px;';
    userSpan.textContent = `${user.full_name || user.username}`;
    
    nav.appendChild(userSpan);

    const logoutBtn = document.createElement('a');

    logoutBtn.href = '#';
    logoutBtn.textContent = 'Log out';
    logoutBtn.style.cssText = 'cursor: pointer;';

    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (_) {
        // nothing :)
      }

      localStorage.removeItem('professorAuthed');
      window.location.href = 'login.html';
    });
    nav.appendChild(logoutBtn);
  }
}