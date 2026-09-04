let articles = [];

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderHero(article) {
  const hero = document.getElementById('hero');
  hero.innerHTML = `
    <a class="hero-link" href="post.html?id=${article.id}">
      <div class="hero-text">
        <div class="featured-top">
          <div class="hero-category">${article.category}</div>
          <h2 class="hero-title">${article.title}</h2>
        </div>
        <div class="featured-bottom">
          <p class="hero-excerpt">${article.excerpt}</p>
          <div class="hero-meta">
            <span>By ${article.author}</span>
            <span class="stats">${article.likes} Likes &nbsp;|&nbsp; ${article.comments} Comments</span>
          </div>
        </div>
      </div>
      <div class="hero-image" style="background-image:url('${article.image}')"></div>
    </a>
  `;
}

function renderDaily(items) {
  document.getElementById('daily-date').textContent =
    new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const cols = document.getElementById('daily-cols');
  cols.innerHTML = items.map(a => `
    <div class="daily-col">
      <h3>${a.title}</h3>
      <div class="daily-byline">
        <span class="daily-avatar"></span>
        <span>${a.author}</span>
      </div>
      <p class="body-text">${a.excerpt}</p>
    </div>
  `).join('');
}

const SECTION_THEMES = ['dark', 'cream', 'pink'];

function renderSmallCard(a) {
  return `
    <a class="mini-card" href="post.html?id=${a.id}">
      <div class="mini-card-image" style="background-image:url('${a.image}')"></div>
      <div class="mini-card-title-row">
        <h4 class="mini-card-title">${a.title}</h4>
        <span class="card-arrow">&#8594;</span>
      </div>
      <div class="card-divider"></div>
      <p class="mini-card-excerpt">${a.excerpt}</p>
      <div class="card-meta">
        <span>${a.author}</span>
        <span class="card-stats">${a.likes} Likes &nbsp;|&nbsp; ${a.comments} Comments</span>
      </div>
    </a>
  `;
}

function renderMoreCard(linkCategory, label) {
  return `
    <a class="mini-card more-card" href="category.html?cat=${encodeURIComponent(linkCategory)}">
      <h3 class="more-card-title">Read more<br>${label}&hellip;</h3>
      <span class="more-card-cta">Dive into it <span class="card-arrow">&#8594;</span></span>
    </a>
  `;
}

function renderCategorySection(category, items, theme, { showMoreCard = true, moreCardLinkCategory } = {}) {
  const [featured, ...rest] = items;
  const rowOne = rest.slice(0, 3);
  const rowTwo = rest.slice(3, 5);
  const linkCategory = moreCardLinkCategory || category;
  const hasEnoughForMoreCard = 1 + rowOne.length + rowTwo.length >= 6;

  return `
    <section class="category-section ${theme}">
      <a class="category-featured" href="post.html?id=${featured.id}">
        <div class="featured-text">
          <div class="featured-top">
            <div class="featured-category">${category}</div>
            <h2 class="featured-title">${featured.title}</h2>
          </div>
          <div class="featured-bottom">
            <p class="featured-excerpt">${featured.excerpt}</p>
            <div class="hero-meta">
              <span>By ${featured.author}</span>
              <span class="stats">${featured.likes} Likes &nbsp;|&nbsp; ${featured.comments} Comments</span>
            </div>
          </div>
        </div>
        <div class="featured-image" style="background-image:url('${featured.image}')"></div>
      </a>
      ${rowOne.length ? `
        <div class="category-grid">
          ${rowOne.map(renderSmallCard).join('')}
        </div>
      ` : ''}
      ${showMoreCard && hasEnoughForMoreCard ? `
        <div class="category-grid category-grid-full">
          ${rowTwo.map(renderSmallCard).join('')}
          ${renderMoreCard(linkCategory, linkCategory)}
        </div>
      ` : (rowTwo.length ? `
        <div class="category-grid category-grid-full">
          ${rowTwo.map(renderSmallCard).join('')}
        </div>
      ` : '')}
    </section>
  `;
}

function renderCategorySections(allArticles) {
  const byCategory = {};
  allArticles.forEach(a => {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    byCategory[a.category].push(a);
  });

  const container = document.getElementById('category-sections');
  container.innerHTML = Object.entries(byCategory)
    .filter(([, items]) => items.length > 0)
    .map(([category, items], i) =>
      renderCategorySection(category, items, SECTION_THEMES[i % SECTION_THEMES.length])
    )
    .join('');
}

function setupMenu() {
  const toggle = document.getElementById('menu-toggle');
  const closeBtn = document.getElementById('menu-close');
  const overlay = document.getElementById('menu-overlay');
  const menu = document.getElementById('side-menu');

  function openMenu() {
    menu.classList.add('open');
    overlay.classList.add('open');
    document.body.classList.add('menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    menu.classList.remove('open');
    overlay.classList.remove('open');
    document.body.classList.remove('menu-open');
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  }

  toggle.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

async function init() {
  setupMenu();

  if (!document.getElementById('hero')) return;

  const res = await fetch('data/articles.json');
  articles = await res.json();

  renderHero(articles[0]);
  renderDaily(articles.slice(1, 4));
  renderCategorySections(articles);
}

init().catch(err => console.error('init failed:', err));
