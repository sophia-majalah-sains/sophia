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

// ---- Nav Search ----
var _searchIndex = null;
var _searchOpen = false;

async function loadSearchIndex() {
  if (_searchIndex) return;
  try {
    var base = document.querySelector('base') ? document.querySelector('base').href : '';
    var res = await fetch('/search-index.json');
    if (res.ok) _searchIndex = await res.json();
  } catch(e) { _searchIndex = []; }
}

function toggleNavSearch() {
  _searchOpen = !_searchOpen;
  var box = document.getElementById('nav-search-box');
  if (!box) return;
  box.style.display = _searchOpen ? 'block' : 'none';
  if (_searchOpen) {
    loadSearchIndex();
    setTimeout(function() {
      var inp = document.getElementById('nav-search-input');
      if (inp) inp.focus();
    }, 50);
  }
}

function handleNavSearch(q) {
  var results = document.getElementById('nav-search-results');
  if (!results) return;
  q = (q || '').trim().toLowerCase();
  if (!q || !_searchIndex) { results.innerHTML = ''; return; }

  var matches = _searchIndex.filter(function(a) {
    return (a.title || '').toLowerCase().includes(q) ||
           (a.excerpt || '').toLowerCase().includes(q) ||
           (a.rubrik || '').toLowerCase().includes(q);
  }).slice(0, 6);

  if (!matches.length) {
    results.innerHTML = '<div class="search-empty">Tidak ada hasil untuk "' + q + '"</div>';
    return;
  }

  results.innerHTML = matches.map(function(a) {
    return '<a class="nav-search-result" href="' + a.url + '" onclick="toggleNavSearch()">' +
      '<span class="search-result-rubrik">' + (a.rubrik || '') + '</span>' +
      '<span class="search-result-title">' + (a.title || '') + '</span>' +
      '<span class="search-result-excerpt">' + (a.excerpt || '') + '</span>' +
      '</a>';
  }).join('');
}

// Close search on outside click
document.addEventListener('click', function(e) {
  var wrap = document.getElementById('nav-search-wrap');
  if (wrap && !wrap.contains(e.target) && _searchOpen) toggleNavSearch();
});


function toggleUserDropdown() {
  var menu = document.getElementById('nav-user-menu');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// Close dropdown on outside click
document.addEventListener('click', function(e) {
  var btn  = document.getElementById('nav-user-btn');
  var menu = document.getElementById('nav-user-menu');
  if (!btn || !menu) return;
  if (!btn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = 'none';
  }
});


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

// ---- Artikel page search (works with rubrik filter) ----
var _activeRubrik = 'semua';
var _activeSearch = '';

function filterArticlesBySearch(q) {
  _activeSearch = (q || '').trim().toLowerCase();
  applyArticleFilters();
}

function applyArticleFilters() {
  var cards = document.querySelectorAll('.article-card[data-rubrik]');
  cards.forEach(function(card) {
    var rubrikMatch = _activeRubrik === 'semua' || card.getAttribute('data-rubrik') === _activeRubrik;
    var text = (card.textContent || '').toLowerCase();
    var searchMatch = !_activeSearch || text.includes(_activeSearch);
    card.style.display = (rubrikMatch && searchMatch) ? '' : 'none';
  });
}


document.addEventListener('DOMContentLoaded', function() {
  var filters = document.querySelectorAll('.rubrik-filter');
  if (!filters.length) return;

  filters.forEach(function(btn) {
    btn.addEventListener('click', function() {
      _activeRubrik = btn.getAttribute('data-filter');
      filters.forEach(function(f) { f.classList.remove('active'); });
      btn.classList.add('active');
      applyArticleFilters();
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
