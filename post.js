const POST_CATEGORY_ACCENTS = {
  News: 'var(--sage)',
  Places: 'var(--orange)',
  Jobs: 'var(--sage)',
  Visas: 'var(--pink)',
  Schools: 'var(--orange)',
  Activities: 'var(--sage)',
  Accommodations: 'var(--pink)',
  Food: 'var(--orange)',
};

function getPostIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get('id')) || null;
}

function applyPostAccent(category) {
  const accent = POST_CATEGORY_ACCENTS[category] || 'var(--sage)';
  const header = document.getElementById('site-header');

  header.style.background = accent;
  header.classList.add('accent-active');

  document.querySelectorAll('#utility-nav a').forEach(a => {
    const isActive = a.dataset.cat === category;
    a.classList.toggle('active', isActive);
    a.style.background = isActive ? accent : '';
  });
}

function formatPostDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const DUMMY_COMMENTS = [
  { name: 'A. Rahardjo', text: "This matches exactly what happened when I went through this last year. Wish I'd read something like this sooner." },
  { name: 'S. Wijaya', text: "Appreciate someone actually naming numbers instead of the usual vague warnings." },
  { name: 'M. Tanaka', text: "Following up on this one, curious if anything's changed since it was published." },
];

function renderShareButtons(article) {
  const url = window.location.href;
  const text = encodeURIComponent(article.title);
  const encodedUrl = encodeURIComponent(url);

  return `
    <div class="post-share">
      <span class="post-share-label">Share this</span>
      <div class="post-share-buttons">
        <a class="share-btn" target="_blank" rel="noopener" aria-label="Share on X"
           href="https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}">X</a>
        <a class="share-btn" target="_blank" rel="noopener" aria-label="Share on Facebook"
           href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}">Facebook</a>
        <a class="share-btn" target="_blank" rel="noopener" aria-label="Share on WhatsApp"
           href="https://wa.me/?text=${text}%20${encodedUrl}">WhatsApp</a>
        <button class="share-btn" id="copy-link-btn" type="button" aria-label="Copy link">Copy Link</button>
      </div>
    </div>
  `;
}

function renderComments(article) {
  const count = article.comments || 0;
  const comments = DUMMY_COMMENTS.slice(0, Math.min(3, count > 0 ? 3 : 0));

  return `
    <section class="post-comments">
      <h2 class="post-comments-title">Comments (<span id="comment-count">${count}</span>)</h2>
      <form class="comment-form" id="comment-form">
        <textarea class="comment-input" id="comment-input" placeholder="Add a comment..." rows="3" required></textarea>
        <button type="submit" class="comment-submit">Post Comment</button>
      </form>
      <div class="comment-list" id="comment-list">
        ${comments.map(c => `
          <div class="comment-item">
            <div class="comment-avatar"></div>
            <div class="comment-body">
              <div class="comment-author">${c.name}</div>
              <p class="comment-text">${c.text}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

function renderPost(article, related) {
  document.title = `${article.title} — Work From Indo`;

  const bodyParagraphs = Array.isArray(article.body)
    ? article.body
    : [article.excerpt];

  const root = document.getElementById('post-root');
  root.innerHTML = `
    <article class="post">
      <div class="post-hero" style="background-image:url('${article.image}')">
        <div class="post-hero-overlay">
          <div class="post-category">${article.category}</div>
          <h1 class="post-title">${article.title}</h1>
          <div class="post-meta">
            <span>By ${article.author}</span>
            <span class="post-date">${formatPostDate(article.date)}</span>
            <span class="stats">${article.likes} Likes &nbsp;|&nbsp; ${article.comments} Comments</span>
          </div>
        </div>
      </div>
      <div class="post-body">
        ${bodyParagraphs.map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class="post-actions">
        <button class="like-btn" id="like-btn" type="button" aria-pressed="false">
          <span class="like-icon">&#9825;</span>
          <span id="like-count">${article.likes}</span> Likes
        </button>
        ${renderShareButtons(article)}
      </div>
      ${renderComments(article)}
      <a href="category.html?cat=${encodeURIComponent(article.category)}" class="post-back">
        &#8592; Back to ${article.category}
      </a>
    </article>
    ${related.length ? `
      <section class="post-related">
        <h2 class="post-related-title">More in ${article.category}</h2>
        <div class="category-grid category-grid-full">
          ${related.map(renderSmallCard).join('')}
        </div>
      </section>
    ` : ''}
  `;

  root.querySelectorAll('.mini-card').forEach(card => {
    card.style.cursor = 'pointer';
  });

  setupLikeButton(article);
  setupCopyLink();
  setupCommentForm(article);
}

function setupLikeButton(article) {
  const btn = document.getElementById('like-btn');
  const countEl = document.getElementById('like-count');
  let liked = false;
  const baseCount = article.likes;

  btn.addEventListener('click', () => {
    liked = !liked;
    btn.classList.toggle('liked', liked);
    btn.setAttribute('aria-pressed', String(liked));
    btn.querySelector('.like-icon').innerHTML = liked ? '&#9829;' : '&#9825;';
    countEl.textContent = liked ? baseCount + 1 : baseCount;
  });
}

function setupCopyLink() {
  const btn = document.getElementById('copy-link-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = original; }, 1500);
    } catch (err) {
      console.error('copy link failed:', err);
    }
  });
}

function setupCommentForm(article) {
  const form = document.getElementById('comment-form');
  const input = document.getElementById('comment-input');
  const list = document.getElementById('comment-list');
  const countEl = document.getElementById('comment-count');
  let count = article.comments || 0;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
      <div class="comment-avatar"></div>
      <div class="comment-body">
        <div class="comment-author">You</div>
        <p class="comment-text"></p>
      </div>
    `;
    item.querySelector('.comment-text').textContent = text;
    list.prepend(item);

    count += 1;
    countEl.textContent = count;
    input.value = '';
  });
}

async function initPostPage() {
  const id = getPostIdFromUrl();
  const res = await fetch('data/articles.json');
  const articles = await res.json();

  const article = articles.find(a => a.id === id) || articles[0];
  applyPostAccent(article.category);

  const related = articles
    .filter(a => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  renderPost(article, related);
}

initPostPage().catch(err => console.error('post page failed:', err));
