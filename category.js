const CATEGORY_ACCENTS = {
  News: 'var(--sage)',
  Places: 'var(--orange)',
  Jobs: 'var(--sage)',
  Visas: 'var(--pink)',
  Schools: 'var(--orange)',
  Activities: 'var(--sage)',
  Accommodations: 'var(--pink)',
  Food: 'var(--orange)',
};

function getCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('cat') || 'News';
}

function applyAccent(category) {
  const accent = CATEGORY_ACCENTS[category] || 'var(--sage)';
  const header = document.getElementById('site-header');

  header.style.background = accent;
  header.classList.add('accent-active');

  document.querySelectorAll('#utility-nav a').forEach(a => {
    const isActive = a.dataset.cat === category;
    a.classList.toggle('active', isActive);
    a.style.background = isActive ? accent : '';
  });
}

const SUBCATEGORIES = {
  Places: ['Island', 'Provinces', 'Cities'],
  Schools: ['Elementary', 'High School', 'College'],
  Visas: ['The Law', 'Support Companies'],
};

const PAGE_SIZE = 6;
let pendingItems = [];
let scrollObserver = null;

function loadNextBatch() {
  const grid = document.getElementById('category-infinite-grid');
  const sentinel = document.getElementById('category-scroll-sentinel');
  if (!grid || !pendingItems.length) {
    if (scrollObserver) scrollObserver.disconnect();
    if (sentinel) sentinel.remove();
    return;
  }

  const batch = pendingItems.splice(0, PAGE_SIZE);
  grid.insertAdjacentHTML('beforeend', batch.map(renderSmallCard).join(''));

  if (!pendingItems.length) {
    if (scrollObserver) scrollObserver.disconnect();
    if (sentinel) sentinel.remove();
  }
}

function setupInfiniteScroll() {
  const sentinel = document.getElementById('category-scroll-sentinel');
  if (!sentinel) return;

  scrollObserver = new IntersectionObserver(entries => {
    if (entries.some(e => e.isIntersecting)) loadNextBatch();
  }, { rootMargin: '400px' });

  scrollObserver.observe(sentinel);
}

function renderSubcategorySection(subcat, items, parentCategory) {
  if (!items.length) return '';

  const sectionHtml = renderCategorySection(subcat, items, 'cream', {
    showMoreCard: true,
    moreCardLinkCategory: parentCategory,
  });

  return `
    <div class="subcategory-block">
      <h2 class="subcategory-title">${subcat}</h2>
      ${sectionHtml}
    </div>
  `;
}

function renderCategoryPage(category, items) {
  document.getElementById('category-page-title').textContent = category;
  document.title = `${category} — Work From Indo`;

  const container = document.getElementById('category-page-content');
  if (!items.length) {
    container.innerHTML = `<p style="padding:40px 0;opacity:0.7;">No articles in this category yet.</p>`;
    return;
  }

  const subcats = SUBCATEGORIES[category];
  if (subcats) {
    container.innerHTML = subcats
      .map(subcat => renderSubcategorySection(subcat, items.filter(a => a.subcategory === subcat), category))
      .join('');
    return;
  }

  const [featured, ...rest] = items;
  const featuredHtml = renderCategorySection(category, [featured], 'cream');

  const firstBatch = rest.slice(0, PAGE_SIZE);
  pendingItems = rest.slice(PAGE_SIZE);

  const gridHtml = rest.length
    ? `<div class="category-grid category-grid-full" id="category-infinite-grid">${firstBatch.map(renderSmallCard).join('')}</div>
       ${pendingItems.length ? '<div id="category-scroll-sentinel" aria-hidden="true"></div>' : ''}`
    : '';

  container.innerHTML = featuredHtml + gridHtml;

  if (pendingItems.length) setupInfiniteScroll();
}

async function initCategoryPage() {
  const category = getCategoryFromUrl();
  applyAccent(category);

  const res = await fetch('data/articles.json');
  const articles = await res.json();
  const items = articles.filter(a => a.category === category);

  renderCategoryPage(category, items);
}

initCategoryPage().catch(err => console.error('category page failed:', err));
