/**
 * GlowHaven — Dynamic Content Loader
 * Fetches site content from Cloudflare Worker API and renders it into the page.
 * Falls back to whatever is already in the HTML if the API is unreachable.
 */

const CONTENT_API = 'https://glowhaven-api.jabernizar98.workers.dev';

let _contentCache = null;

/**
 * Fetch all content from the API (or return cached).
 */
export async function fetchSiteContent() {
  if (_contentCache) return _contentCache;

  try {
    const res = await fetch(CONTENT_API + '/api/content');
    if (!res.ok) throw new Error('API returned ' + res.status);
    _contentCache = await res.json();
    return _contentCache;
  } catch (e) {
    console.warn('Content API unavailable, using static HTML fallback:', e.message);
    return null;
  }
}

/**
 * Render all dynamic sections. Call once on DOMContentLoaded.
 */
export async function renderDynamicContent() {
  const data = await fetchSiteContent();
  if (!data) return; // API unavailable — keep static HTML

  if (data.hero) renderHero(data.hero);
  if (data.announcements) renderAnnouncements(data.announcements);
  if (data.promoBanners) renderPromoBanners(data.promoBanners);
  if (data.whySection) renderWhySection(data.whySection);
  if (data.testimonials) renderTestimonials(data.testimonials);
  if (data.newsletter) renderNewsletter(data.newsletter);
  if (data.siteSettings) applySiteSettings(data.siteSettings);
}

/* ═══════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════ */
function renderHero(hero) {
  // Badge
  const badge = document.querySelector('.hero-badge');
  if (badge) {
    badge.innerHTML = `<i class="${esc(hero.badgeIcon || 'fas fa-gem')}"></i> ${esc(hero.badge || '')}`;
  }

  // Title
  const title = document.querySelector('.hero-title');
  if (title) {
    title.innerHTML = `${esc(hero.title || '')} <span class="hero-accent">${esc(hero.titleAccent || '')}</span>`;
  }

  // Subtitle
  const subtitle = document.querySelector('.hero-subtitle');
  if (subtitle) subtitle.textContent = hero.subtitle || '';

  // Trust items
  const trustRow = document.querySelector('.hero-trust-row');
  if (trustRow && hero.trustItems?.length) {
    trustRow.innerHTML = hero.trustItems.map(t =>
      `<span><i class="${esc(t.icon)}"></i> ${esc(t.text)}</span>`
    ).join('');
  }

  // Brands
  const brandsList = document.querySelector('.hero-brands-list');
  if (brandsList && hero.brands?.length) {
    brandsList.innerHTML = hero.brands.map(b =>
      `<a href="${esc(b.href)}">${esc(b.name)}</a>`
    ).join('');
  }

  // CTA buttons
  if (hero.ctaPrimary) {
    const primary = document.querySelector('.btn-hero-primary');
    if (primary) {
      primary.href = hero.ctaPrimary.href || '#';
      primary.innerHTML = `${esc(hero.ctaPrimary.text)} <i class="${esc(hero.ctaPrimary.icon || '')}"></i>`;
    }
  }
  if (hero.ctaSecondary) {
    const secondary = document.querySelector('.btn-hero-glass');
    if (secondary) {
      secondary.href = hero.ctaSecondary.href || '#';
      secondary.innerHTML = `<i class="${esc(hero.ctaSecondary.icon || '')}"></i> ${esc(hero.ctaSecondary.text)}`;
    }
  }
}

/* ═══════════════════════════════════════════════
   ANNOUNCEMENTS BAR
   ═══════════════════════════════════════════════ */
function renderAnnouncements(ann) {
  const track = document.querySelector('.announcement-track');
  if (!track || !ann.items?.length) return;

  // Build the items (duplicate for seamless scroll)
  const itemsHtml = ann.items.map(it =>
    `<span class="announcement-item"><i class="${esc(it.icon)}"></i> ${esc(it.text)}</span>`
  ).join('');

  // Include the countdown item if it exists in the DOM
  const countdownItem = '<span class="announcement-item"><i class="fas fa-clock"></i> <strong>Beauty Sale Ends In:</strong> <span class="announcement-countdown">00d 00h 00m 00s</span></span>';

  track.innerHTML = itemsHtml + countdownItem + itemsHtml + countdownItem;
}

/* ═══════════════════════════════════════════════
   PROMO BANNERS
   ═══════════════════════════════════════════════ */
function renderPromoBanners(promo) {
  const grid = document.querySelector('.promo-grid');
  if (!grid || !promo.banners?.length) return;

  grid.innerHTML = promo.banners.map(b => `
    <a href="${esc(b.href)}" class="promo-card ${esc(b.cssClass || '')}">
      <div class="promo-card-content">
        <span class="promo-tag">${esc(b.tag)}</span>
        <h3>${esc(b.title)}</h3>
        <p>${esc(b.description)}</p>
        <span class="promo-cta">${esc(b.ctaText)} <i class="fas fa-arrow-right"></i></span>
      </div>
      <div class="promo-card-art" aria-hidden="true"><i class="${esc(b.icon)}"></i></div>
    </a>
  `).join('');
}

/* ═══════════════════════════════════════════════
   WHY SECTION
   ═══════════════════════════════════════════════ */
function renderWhySection(why) {
  const titleEl = document.querySelector('.why-title');
  if (titleEl) titleEl.textContent = why.title || '';

  const grid = document.querySelector('.why-grid');
  if (!grid || !why.cards?.length) return;

  grid.innerHTML = why.cards.map(c => `
    <div class="why-card">
      <div class="why-icon"><i class="${esc(c.icon)}"></i></div>
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.description)}</p>
    </div>
  `).join('');
}

/* ═══════════════════════════════════════════════
   TESTIMONIALS
   ═══════════════════════════════════════════════ */
function renderTestimonials(test) {
  // Section header
  const tagEl = document.querySelector('.testimonials-section .section-tag');
  if (tagEl) tagEl.innerHTML = `<i class="fas fa-star"></i> ${esc(test.sectionTag || 'Reviews')}`;

  const titleEl = document.querySelector('.testimonials-section .section-header h2');
  if (titleEl) titleEl.textContent = test.title || '';

  const subEl = document.querySelector('.testimonials-section .section-header p');
  if (subEl) subEl.textContent = test.subtitle || '';

  // Cards
  const grid = document.querySelector('.testimonials-grid');
  if (!grid || !test.items?.length) return;

  grid.innerHTML = test.items.map(t => {
    const stars = '★'.repeat(Math.min(5, Math.max(0, t.stars || 5)));
    const initial = (t.authorName || 'A').charAt(0).toUpperCase();
    return `
    <div class="testimonial-card">
      <div class="testimonial-stars">${stars}</div>
      <p class="testimonial-text">${esc(t.text)}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${initial}</div>
        <div class="testimonial-author-info">
          <strong>${esc(t.authorName)}</strong>
          <span>${esc(t.authorLabel)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════════
   NEWSLETTER
   ═══════════════════════════════════════════════ */
function renderNewsletter(nl) {
  const heading = document.getElementById('newsletterHeading');
  if (heading) heading.textContent = nl.title || '';

  const sub = document.querySelector('.newsletter-section > p');
  if (sub) sub.textContent = nl.subtitle || '';
}

/* ═══════════════════════════════════════════════
   SITE SETTINGS (name, footer, social)
   ═══════════════════════════════════════════════ */
function applySiteSettings(settings) {
  // Footer description
  const footerDesc = document.querySelector('.footer-brand-col > p');
  if (footerDesc && settings.footerDescription) {
    footerDesc.textContent = settings.footerDescription;
  }

  // Social links in footer
  const footerSocial = document.querySelector('.footer-social');
  if (footerSocial && settings.social?.length) {
    footerSocial.innerHTML = settings.social.map(s =>
      `<a href="${esc(s.href)}" aria-label="${esc(s.platform)}"><i class="${esc(s.icon)}"></i></a>`
    ).join('');
  }

  // Social section (if exists)
  const socialSection = document.querySelector('.social-links');
  if (socialSection && settings.social?.length) {
    socialSection.innerHTML = settings.social.map(s =>
      `<a href="${esc(s.href)}" aria-label="${esc(s.platform)}"><i class="${esc(s.icon)}" aria-hidden="true"></i> ${esc(s.platform)}</a>`
    ).join('');
  }
}

/* ═══════════════════════════════════════════════
   HELPER
   ═══════════════════════════════════════════════ */
function esc(str) {
  const d = document.createElement('div');
  d.textContent = str || '';
  return d.innerHTML;
}
