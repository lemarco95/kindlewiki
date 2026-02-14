/* ===== Focus Mode - Reader Mode Engine ===== */

if (window.__focusReaderInitialized) {
  // Already loaded — skip re-initialization
} else {
window.__focusReaderInitialized = true;

(() => {
  let readerActive = false;
  let overlay = null;
  let preferences = {
    fontSize: 20,
    fontFamily: 'serif',
    theme: 'light',
    lineSpacing: 'normal',
  };

  const FONT_MIN = 14;
  const FONT_MAX = 28;

  const LINE_SPACING_VALUES = {
    compact: 1.4,
    normal: 1.8,
    relaxed: 2.2,
  };

  const FONT_FAMILIES = {
    serif: 'Georgia, "Times New Roman", serif',
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    mono: '"SF Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
  };

  const STRIP_TAGS = [
    // Standard cleanup
    'script', 'style', 'noscript', 'iframe', 'form', 'input', 'button',
    'select', 'textarea',
    // Wikipedia edit links
    '.mw-editsection',
    // Navigation boxes at bottom
    '.navbox', '.navbox-styles',
    // Sister project links
    '.sistersitebox',
    // Reference lists (keep footnote markers in text)
    '.reflist', '.references', '.reference',
    // Empty elements
    '.mw-empty-elt',
    // Print-hidden elements
    '.noprint',
    // Message/maintenance boxes
    '.mbox-small', '.ambox', '.tmbox', '.ombox', '.cmbox', '.fmbox',
    // Disambiguation notes
    '.hatnote',
    // Wikipedia's own TOC (we build our own)
    '#toc', '.toc',
    // Category links
    '#catlinks',
    // Accessibility jump links
    '.mw-jump-link',
  ];

  // --- Content Extraction ---

  function findContentElement() {
    return document.querySelector('#mw-content-text .mw-parser-output');
  }

  function extractContent() {
    const source = findContentElement();
    if (!source) return null;

    const clone = source.cloneNode(true);

    // Strip unwanted elements
    STRIP_TAGS.forEach((sel) => {
      try {
        clone.querySelectorAll(sel).forEach((el) => el.remove());
      } catch (e) { /* skip */ }
    });

    // Get title — use Wikipedia's specific heading element
    const title =
      document.querySelector('#firstHeading')?.textContent.trim() ||
      document.title.replace(/\s*[-|–—].*$/, '').trim() ||
      document.title;

    // Calculate reading time
    const text = clone.textContent || '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    return {
      title,
      html: clone.innerHTML,
      readingTime,
      siteName: 'Wikipedia',
    };
  }

  // --- Table of Contents ---

  function buildTableOfContents(articleBody) {
    const headings = articleBody.querySelectorAll('h1, h2, h3, h4');
    if (headings.length < 2) return null;

    const toc = document.createElement('div');
    toc.className = 'reader-toc';

    const tocHeader = document.createElement('div');
    tocHeader.className = 'reader-toc-header';
    tocHeader.textContent = 'Table of Contents';
    toc.appendChild(tocHeader);

    const tocList = document.createElement('ul');
    tocList.className = 'reader-toc-list';

    headings.forEach((heading, i) => {
      const id = `reader-heading-${i}`;
      heading.id = id;

      const li = document.createElement('li');
      li.className = `reader-toc-item reader-toc-${heading.tagName.toLowerCase()}`;

      const link = document.createElement('a');
      link.href = `#${id}`;
      link.textContent = heading.textContent.trim();
      link.addEventListener('click', (e) => {
        e.preventDefault();
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      li.appendChild(link);
      tocList.appendChild(li);
    });

    toc.appendChild(tocList);
    return toc;
  }

  // --- Overlay Building ---

  function buildReaderOverlay(content) {
    overlay = document.createElement('div');
    overlay.id = 'focus-reader-overlay';
    overlay.className = `reader-theme-${preferences.theme}`;

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'reader-progress-bar';
    const progressFill = document.createElement('div');
    progressFill.className = 'reader-progress-fill';
    progressBar.appendChild(progressFill);

    // Top bar
    const topbar = document.createElement('div');
    topbar.className = 'reader-topbar';
    topbar.innerHTML = `
      <button class="reader-toc-toggle" aria-label="Toggle table of contents" title="Table of Contents">&#x2630;</button>
      <span class="reader-site-name">${escapeHtml(content.siteName)}</span>
      <span class="reader-reading-time">${content.readingTime} min read</span>
      <button class="reader-close-btn" aria-label="Close reader" title="Close (Esc)">&#x2715;</button>
    `;

    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'reader-content-wrapper';
    const contentArea = document.createElement('div');
    contentArea.className = 'reader-content';
    contentArea.innerHTML = `
      <h1 class="reader-title">${escapeHtml(content.title)}</h1>
      <div class="reader-meta">
        <span>${content.readingTime} min read</span>
        <span>&middot;</span>
        <span>${escapeHtml(content.siteName)}</span>
      </div>
      <div class="reader-article-body">${content.html}</div>
    `;
    contentWrapper.appendChild(contentArea);

    // Controls bar
    const controls = document.createElement('div');
    controls.className = 'reader-controls';
    controls.innerHTML = `
      <div class="reader-controls-inner">
        <div class="reader-control-group">
          <label>Size</label>
          <div class="reader-control-buttons">
            <button class="reader-ctrl-btn" data-action="font-down" aria-label="Decrease font size">A&#x2212;</button>
            <span class="reader-font-size-display">${preferences.fontSize}px</span>
            <button class="reader-ctrl-btn" data-action="font-up" aria-label="Increase font size">A+</button>
          </div>
        </div>
        <div class="reader-control-group">
          <label>Font</label>
          <div class="reader-control-buttons">
            <button class="reader-ctrl-btn font-opt ${preferences.fontFamily === 'serif' ? 'active' : ''}" data-action="font-serif">Serif</button>
            <button class="reader-ctrl-btn font-opt ${preferences.fontFamily === 'sans' ? 'active' : ''}" data-action="font-sans">Sans</button>
            <button class="reader-ctrl-btn font-opt ${preferences.fontFamily === 'mono' ? 'active' : ''}" data-action="font-mono">Mono</button>
          </div>
        </div>
        <div class="reader-control-group">
          <label>Theme</label>
          <div class="reader-control-buttons">
            <button class="reader-ctrl-btn theme-opt ${preferences.theme === 'light' ? 'active' : ''}" data-action="theme-light" aria-label="Light theme"><span class="theme-swatch swatch-light"></span>Light</button>
            <button class="reader-ctrl-btn theme-opt ${preferences.theme === 'sepia' ? 'active' : ''}" data-action="theme-sepia" aria-label="Sepia theme"><span class="theme-swatch swatch-sepia"></span>Sepia</button>
            <button class="reader-ctrl-btn theme-opt ${preferences.theme === 'dark' ? 'active' : ''}" data-action="theme-dark" aria-label="Dark theme"><span class="theme-swatch swatch-dark"></span>Dark</button>
          </div>
        </div>
        <div class="reader-control-group">
          <label>Spacing</label>
          <div class="reader-control-buttons">
            <button class="reader-ctrl-btn spacing-opt ${preferences.lineSpacing === 'compact' ? 'active' : ''}" data-action="spacing-compact">Compact</button>
            <button class="reader-ctrl-btn spacing-opt ${preferences.lineSpacing === 'normal' ? 'active' : ''}" data-action="spacing-normal">Normal</button>
            <button class="reader-ctrl-btn spacing-opt ${preferences.lineSpacing === 'relaxed' ? 'active' : ''}" data-action="spacing-relaxed">Relaxed</button>
          </div>
        </div>
      </div>
      <button class="reader-controls-toggle" aria-label="Toggle controls">
        <span class="reader-controls-toggle-icon">&#x2699;</span>
      </button>
    `;

    // Build body layout (TOC sidebar + content)
    const bodyLayout = document.createElement('div');
    bodyLayout.className = 'reader-body-layout';

    // Build TOC from the article body after it's populated
    const articleBody = contentArea.querySelector('.reader-article-body');
    const toc = buildTableOfContents(articleBody);
    if (toc) {
      bodyLayout.appendChild(toc);
      bodyLayout.classList.add('has-toc');
    }

    bodyLayout.appendChild(contentWrapper);

    overlay.appendChild(progressBar);
    overlay.appendChild(topbar);
    overlay.appendChild(bodyLayout);
    overlay.appendChild(controls);

    document.documentElement.appendChild(overlay);

    // Apply preferences
    applyPreferences();

    // Event listeners
    topbar.querySelector('.reader-close-btn').addEventListener('click', deactivate);

    // TOC toggle
    const tocToggle = topbar.querySelector('.reader-toc-toggle');
    tocToggle.addEventListener('click', () => {
      overlay.classList.toggle('toc-open');
    });
    // Show TOC by default if present
    if (toc) {
      overlay.classList.add('toc-open');
    }

    // Controls toggle
    const controlsToggle = controls.querySelector('.reader-controls-toggle');
    controlsToggle.addEventListener('click', () => {
      controls.classList.toggle('expanded');
    });

    // Control actions
    controls.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      handleControlAction(btn.dataset.action);
    });

    // Scroll progress
    contentWrapper.addEventListener('scroll', () => {
      const scrollTop = contentWrapper.scrollTop;
      const scrollHeight = contentWrapper.scrollHeight - contentWrapper.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      progressFill.style.width = `${progress}%`;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', keyboardHandler);

    // Start with controls expanded
    controls.classList.add('expanded');
  }

  function handleControlAction(action) {
    if (action === 'font-down') {
      preferences.fontSize = Math.max(FONT_MIN, preferences.fontSize - 2);
    } else if (action === 'font-up') {
      preferences.fontSize = Math.min(FONT_MAX, preferences.fontSize + 2);
    } else if (action.startsWith('font-')) {
      preferences.fontFamily = action.replace('font-', '');
    } else if (action.startsWith('theme-')) {
      preferences.theme = action.replace('theme-', '');
    } else if (action.startsWith('spacing-')) {
      preferences.lineSpacing = action.replace('spacing-', '');
    }

    applyPreferences();
    savePreferences();
  }

  function applyPreferences() {
    if (!overlay) return;

    // Theme — preserve toc-open state
    const tocOpen = overlay.classList.contains('toc-open');
    overlay.className = `reader-theme-${preferences.theme}${tocOpen ? ' toc-open' : ''}`;
    overlay.id = 'focus-reader-overlay';

    // Font size
    const contentEl = overlay.querySelector('.reader-article-body');
    if (contentEl) {
      contentEl.style.fontSize = `${preferences.fontSize}px`;
      contentEl.style.lineHeight = `${LINE_SPACING_VALUES[preferences.lineSpacing]}`;
      contentEl.style.fontFamily = FONT_FAMILIES[preferences.fontFamily];
    }

    // Update font size display
    const sizeDisplay = overlay.querySelector('.reader-font-size-display');
    if (sizeDisplay) sizeDisplay.textContent = `${preferences.fontSize}px`;

    // Update active buttons
    overlay.querySelectorAll('.font-opt').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.action === `font-${preferences.fontFamily}`);
    });
    overlay.querySelectorAll('.theme-opt').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.action === `theme-${preferences.theme}`);
    });
    overlay.querySelectorAll('.spacing-opt').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.action === `spacing-${preferences.lineSpacing}`);
    });
  }

  // --- Keyboard Shortcuts ---

  function keyboardHandler(e) {
    if (!readerActive) return;
    if (e.key === 'Escape') {
      deactivate();
    } else if (e.key === '+' || e.key === '=') {
      handleControlAction('font-up');
    } else if (e.key === '-') {
      handleControlAction('font-down');
    } else if (e.key === 't' || e.key === 'T') {
      const themes = ['light', 'sepia', 'dark'];
      const idx = themes.indexOf(preferences.theme);
      preferences.theme = themes[(idx + 1) % themes.length];
      applyPreferences();
      savePreferences();
    }
  }

  // --- Activate / Deactivate ---

  function activate() {
    if (readerActive) return;

    const content = extractContent();
    if (!content) {
      console.warn('Focus Reader: Could not extract content from this page.');
      return { active: false, error: 'no-content' };
    }

    readerActive = true;
    document.body.style.overflow = 'hidden';
    buildReaderOverlay(content);
    saveState(true);
    return { active: true };
  }

  function deactivate() {
    if (!readerActive) return;
    readerActive = false;
    document.body.style.overflow = '';

    if (overlay) {
      overlay.remove();
      overlay = null;
    }

    document.removeEventListener('keydown', keyboardHandler);
    saveState(false);
  }

  // --- Preferences ---

  async function loadPreferences() {
    try {
      const data = await chrome.storage.local.get('readerPreferences');
      if (data.readerPreferences) {
        preferences = { ...preferences, ...data.readerPreferences };
      }
    } catch (e) { /* use defaults */ }
  }

  function savePreferences() {
    try {
      chrome.storage.local.set({ readerPreferences: { ...preferences } });
    } catch (e) { /* silent */ }
  }

  function saveState(active) {
    try {
      chrome.storage.local.set({
        [`reader_${location.hostname}`]: { active },
      });
    } catch (e) { /* silent */ }
  }

  // --- Utilities ---

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Message Listener ---

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.action) {
      case 'toggle':
        if (readerActive) {
          deactivate();
          sendResponse({ active: false });
        } else {
          const result = activate();
          sendResponse(result || { active: readerActive });
        }
        break;
      case 'getState':
        sendResponse({
          active: readerActive,
          preferences: { ...preferences },
        });
        break;
      case 'updateSettings':
        if (msg.settings) {
          Object.assign(preferences, msg.settings);
          applyPreferences();
          savePreferences();
        }
        sendResponse({ preferences: { ...preferences } });
        break;
    }
    return true;
  });

  // Load preferences on init
  loadPreferences();
})();
} // end guard
