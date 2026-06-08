// ============================================================
// SOPHIA — main.js
// ============================================================

// ---- Sticky nav scroll effect ----
(function() {
  var nav = document.getElementById('site-nav');
  if (!nav) return;
  window.addEventListener('scroll', function() {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });
})();

// ---- Mobile nav toggle ----
function toggleMobileNav() {
  var links = document.getElementById('nav-links');
  if (!links) return;
  links.classList.toggle('mobile-open');
}

// Close mobile nav on outside click
document.addEventListener('click', function(e) {
  var links = document.getElementById('nav-links');
  var hamburger = document.getElementById('nav-hamburger');
  if (!links || !hamburger) return;
  if (!links.contains(e.target) && !hamburger.contains(e.target)) {
    links.classList.remove('mobile-open');
  }
});

// ---- Rubrik filter (articles listing page) ----
document.addEventListener('DOMContentLoaded', function() {
  var filters = document.querySelectorAll('.rubrik-filter');
  var cards   = document.querySelectorAll('.article-card[data-rubrik]');

  if (!filters.length) return;

  filters.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var rubrik = btn.getAttribute('data-filter');

      // Update active state
      filters.forEach(function(f) { f.classList.remove('active'); });
      btn.classList.add('active');

      // Filter cards
      cards.forEach(function(card) {
        if (rubrik === 'semua' || card.getAttribute('data-rubrik') === rubrik) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Check URL param on load
  var params = new URLSearchParams(window.location.search);
  var rubrikParam = params.get('rubrik');
  if (rubrikParam) {
    var matchBtn = document.querySelector('.rubrik-filter[data-filter="' + rubrikParam + '"]');
    if (matchBtn) matchBtn.click();
  }
});

// ---- Signup form (newsletter / registration) ----
document.addEventListener('DOMContentLoaded', function() {
  var forms = document.querySelectorAll('.signup-form-el');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var nameInput  = form.querySelector('#signup-name');
      var emailInput = form.querySelector('#signup-email') || form.querySelector('.signup-input');
      var name  = nameInput  ? nameInput.value.trim()  : '';
      var email = emailInput ? emailInput.value.trim()  : '';
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;

      fetch('https://formspree.io/f/mgobolpq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: name, email: email, _subject: 'Pendaftaran Sophia baru: ' + (name||email) })
      }).then(function(res) {
        if (res.ok) {
          form.innerHTML = '<p style="color:var(--sains);font-weight:600;font-size:15px;">Terima kasih' + (name ? ', ' + name : '') + '! Cek emailmu untuk konfirmasi.</p>';
          setTimeout(function() { openAuthModal('register'); }, 1000);
        }
      }).catch(function() {});
    });
  });
});

// ---- Scroll reveal ----
document.addEventListener('DOMContentLoaded', function() {
  if (!('IntersectionObserver' in window)) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach(function(el) {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
});
