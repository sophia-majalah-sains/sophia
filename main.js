// ============================================================
// SOPHIA — main.js
// ============================================================

// ---- Mobile nav ----
function toggleMobileNav() {
  var nav = document.getElementById('site-nav');
  if (!nav) return;
  nav.classList.toggle('mobile-open');
}

document.addEventListener('click', function(e) {
  var nav = document.getElementById('site-nav');
  var hamburger = document.getElementById('nav-hamburger');
  if (!nav || !hamburger) return;
  if (!nav.contains(e.target)) {
    nav.classList.remove('mobile-open');
  }
});

// ---- User dropdown ----
function toggleUserDropdown() {
  var menu = document.getElementById('nav-user-menu');
  if (!menu) return;
  menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', function(e) {
  var btn  = document.getElementById('nav-user-btn');
  var menu = document.getElementById('nav-user-menu');
  if (!btn || !menu) return;
  if (!btn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = 'none';
  }
});

// ---- Nav search ----
function toggleNavSearch() {
  var box = document.getElementById('nav-search-box');
  if (!box) return;
  var isOpen = box.style.display !== 'none';
  box.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    var input = document.getElementById('nav-search-input');
    if (input) { input.value = ''; input.focus(); }
    var results = document.getElementById('nav-search-results');
    if (results) results.innerHTML = '';
  }
}

document.addEventListener('click', function(e) {
  var wrap = document.getElementById('nav-search-wrap');
  if (!wrap) return;
  if (!wrap.contains(e.target)) {
    var box = document.getElementById('nav-search-box');
    if (box) box.style.display = 'none';
  }
});

function handleNavSearch(query) {
  var results = document.getElementById('nav-search-results');
  if (!results) return;
  query = query.trim().toLowerCase();
  if (!query) { results.innerHTML = ''; return; }

  // Search from search-index.json
  if (window._searchIndex) {
    renderNavSearchResults(query, results);
    return;
  }
  fetch('/search-index.json')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      window._searchIndex = data;
      renderNavSearchResults(query, results);
    })
    .catch(function() { results.innerHTML = ''; });
}

function renderNavSearchResults(query, resultsEl) {
  var index = window._searchIndex || [];
  var matches = index.filter(function(item) {
    return (item.title || '').toLowerCase().includes(query)
        || (item.excerpt || '').toLowerCase().includes(query)
        || (item.rubrik || '').toLowerCase().includes(query);
  }).slice(0, 6);

  if (!matches.length) {
    resultsEl.innerHTML = '<div style="padding:12px 14px;font-family:var(--sans);font-size:12px;color:var(--muted);">Tidak ada hasil untuk "' + query + '"</div>';
    return;
  }
  resultsEl.innerHTML = matches.map(function(item) {
    return '<a href="' + item.url + '" class="nav-search-result-item">'
      + '<div class="nav-search-result-tag">' + (item.rubrik || '') + '</div>'
      + '<div class="nav-search-result-title">' + (item.title || '') + '</div>'
      + '</a>';
  }).join('');
}

// ---- Rubrik filter (articles listing page) ----
document.addEventListener('DOMContentLoaded', function() {
  var filters = document.querySelectorAll('.rubrik-filter');
  if (!filters.length) return;

  filters.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var rubrik = btn.getAttribute('data-filter');
      filters.forEach(function(f) { f.classList.remove('active'); });
      btn.classList.add('active');
      filterCards(rubrik, window._currentSearch || '');
    });
  });

  var params = new URLSearchParams(window.location.search);
  var rubrikParam = params.get('rubrik');
  if (rubrikParam) {
    var matchBtn = document.querySelector('.rubrik-filter[data-filter="' + rubrikParam + '"]');
    if (matchBtn) matchBtn.click();
  }
});

function filterCards(rubrik, search) {
  var cards = document.querySelectorAll('.article-card[data-rubrik], .article-row[data-rubrik], .article-featured[data-rubrik]');
  var visible = 0;
  cards.forEach(function(card) {
    var cardRubrik = card.getAttribute('data-rubrik') || '';
    var cardSearch = card.getAttribute('data-search') || '';
    var matchR = rubrik === 'semua' || cardRubrik === rubrik;
    var matchS = !search || cardSearch.includes(search.toLowerCase());
    var show = matchR && matchS;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  var noResults = document.getElementById('noResults');
  if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
}

function filterArticlesBySearch(val) {
  window._currentSearch = val;
  var activeBtn = document.querySelector('.rubrik-filter.active');
  var rubrik = activeBtn ? activeBtn.getAttribute('data-filter') : 'semua';
  filterCards(rubrik, val);
}

// ---- Scroll reveal ----
document.addEventListener('DOMContentLoaded', function() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.fade-up').forEach(function(el) {
      el.style.opacity = '1';
    });
    return;
  }
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.animationPlayState = 'running';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.fade-up').forEach(function(el) {
    el.style.animationPlayState = 'paused';
    observer.observe(el);
  });
});
