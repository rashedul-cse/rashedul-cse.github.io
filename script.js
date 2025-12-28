// Year in footer (safe)
(function () {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// -------------------- Publications filters (safe) --------------------
(function () {
  const typeButtons = document.querySelectorAll('[data-type-filter]');
  const topicButtons = document.querySelectorAll('[data-topic-filter]');
  const yearSelect = document.getElementById('pub-year-select');
  const searchInput = document.getElementById('pub-search-input');
  const allPubItems = document.querySelectorAll('.pub-list li[data-type]');

  // ✅ If this page doesn't have the filter UI, skip this module
  if (!yearSelect || !searchInput || allPubItems.length === 0) return;

  let currentType = 'all';
  let currentTopic = 'all';

  function applyFilters() {
    const yearFilter = yearSelect.value;
    const searchTerm = searchInput.value.trim().toLowerCase();

    allPubItems.forEach(li => {
      const type = li.dataset.type || 'journal';
      const topics = (li.dataset.topics || '')
        .toLowerCase().split(',')
        .map(t => t.trim()).filter(Boolean);

      const year = li.dataset.year || '';
      const titleEl = li.querySelector('.pub-title');
      const titleText = titleEl ? titleEl.textContent.toLowerCase() : li.textContent.toLowerCase();

      let visible = true;
      if (currentType !== 'all' && type !== currentType) visible = false;
      if (visible && currentTopic !== 'all' && !topics.includes(currentTopic)) visible = false;
      if (visible && yearFilter !== 'all' && year !== yearFilter) visible = false;
      if (visible && searchTerm && !titleText.includes(searchTerm)) visible = false;

      li.style.display = visible ? '' : 'none';
    });
  }

  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentType = btn.dataset.typeFilter || 'all';
      applyFilters();
    });
  });

  topicButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      topicButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTopic = btn.dataset.topicFilter || 'all';
      applyFilters();
    });
  });

  yearSelect.addEventListener('change', applyFilters);
  searchInput.addEventListener('input', applyFilters);
})();

// -------------------- Fade-in observer (safe) --------------------
(function () {
  const fadeEls = document.querySelectorAll('.fade-in');
  if (!fadeEls.length || typeof IntersectionObserver === 'undefined') return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  fadeEls.forEach(el => observer.observe(el));
})();

// -------------------- Main UI script (your existing block) --------------------
(function () {
  const root = document.documentElement;

  // Theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  const themeToggle = document.getElementById('themeToggle');
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }
  window.toast = toast;

  if (themeToggle) {
    const setThemeIcon = () => {
      const t = root.getAttribute('data-theme') || 'light';
      const icon = themeToggle.querySelector('.icon');
      if (icon) icon.textContent = (t === 'dark') ? '☀' : '☾';
    };
    setThemeIcon();

    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      toast(`Switched to ${next} mode`);
      setThemeIcon();
    });
  }

  // Mobile nav
  const nav = document.querySelector('.nav-links');
  const navToggle = document.getElementById('navToggle');
  if (nav && navToggle) {
    navToggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => nav.classList.remove('open'))
    );
  }

  // Back to top
  const backBtn = document.getElementById('backToTop');
  if (backBtn) {
    const onScroll = () => backBtn.classList.toggle('show', window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // Reveal on scroll
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  }

  // Counters
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && typeof IntersectionObserver !== 'undefined') {
    const cObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.getAttribute('data-count') || '0', 10);
        const dur = 900;
        const t0 = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - t0) / dur);
          el.textContent = String(Math.floor(target * (p * (2 - p))));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        cObs.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(el => cObs.observe(el));
  }

  // Copy email on click
  document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
    a.addEventListener('click', async () => {
      const email = a.getAttribute('href').replace('mailto:', '').trim();
      try {
        await navigator.clipboard.writeText(email);
        toast('Email copied');
      } catch {}
    });
  });
})();

// -------------------- BibTeX modal (safe) --------------------
(function () {
  const modal = document.getElementById('bibtexModal');
  const textEl = document.getElementById('bibtexText');
  const closeBtn = document.getElementById('bibtexClose');
  const copyBtn = document.getElementById('bibtexCopy');
  const dlBtn = document.getElementById('bibtexDownload');

  // ✅ If modal isn't on this page, skip
  if (!modal || !textEl || !closeBtn || !copyBtn || !dlBtn) return;

  let currentBib = '';

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.bibtex-btn');
    if (!btn) return;

    currentBib = btn.getAttribute('data-bibtex') || '';
    textEl.textContent = currentBib.trim() || 'No BibTeX provided.';
    modal.showModal();
  });

  closeBtn.addEventListener('click', () => modal.close());

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(currentBib.trim());
      copyBtn.textContent = 'Copied!';
      setTimeout(() => (copyBtn.textContent = 'Copy'), 900);
    } catch {
      alert('Copy failed. Please copy manually from the box.');
    }
  });

  dlBtn.addEventListener('click', () => {
    const blob = new Blob([currentBib.trim() + '\n'], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'publication.bib';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  });
})();

// BibTeX inline toggle (already safe)
(function () {
  document.addEventListener('click', function (e) {
    const a = e.target.closest('.pub-bibtex-toggle');
    if (!a) return;

    e.preventDefault();
    const li = a.closest('li');
    if (!li) return;

    const box = li.querySelector('.pub-bibtex');
    if (!box) return;

    const isOpen = !box.hasAttribute('hidden');
    document.querySelectorAll('.pub-bibtex').forEach(p => p.setAttribute('hidden', ''));
    document.querySelectorAll('.pub-bibtex-toggle').forEach(t => t.setAttribute('aria-expanded', 'false'));

    if (!isOpen) {
      box.removeAttribute('hidden');
      a.setAttribute('aria-expanded', 'true');
    }
  });
})();
