(() => {
  const catalog = window.darkwaveDocsCatalog || [];
  const grid = document.querySelector('#docsGrid');
  const search = document.querySelector('#docsSearch');
  const count = document.querySelector('#docsCount');
  const empty = document.querySelector('#docsEmpty');
  const filters = [...document.querySelectorAll('[data-doc-filter]')];
  const params = new URLSearchParams(location.search);
  const requestedLanguage = (params.get('lang') || '').toLowerCase();
  let activeFilter = 'all';

  const themeSelect = document.querySelector('#themeSelect');
  const themeTokens = {bg:'--bg',white:'--white',acid_green:'--acid',hot_pink:'--pink',purple:'--purple',cyan:'--cyan',orange:'--orange',panel:'--panel',line:'--line',muted:'--muted'};
  async function applyTheme(value) {
    const [family,name] = value.split('/');
    const response = await fetch(`data/themes/${encodeURIComponent(family)}/${encodeURIComponent(name)}.json`);
    if (!response.ok) throw new Error('Theme palette unavailable');
    const palette = await response.json();
    for (const [key,token] of Object.entries(themeTokens)) if (palette[key]) document.documentElement.style.setProperty(token, `#${palette[key]}`);
    try { localStorage.setItem('cybercore-theme', value); } catch {}
    document.querySelector('meta[name="theme-color"]').content = `#${palette.bg || '080910'}`;
  }
  async function loadThemes() {
    const response = await fetch('data/cybergrid.json');
    if (!response.ok) throw new Error('Cybergrid unavailable');
    const manifest = await response.json();
    const families = ['cyberpunk','neosynth','synthwave','dystopian','default','cyberdyne','omarchy-live','cybercore-tech'];
    for (const family of families) {
      if (!manifest.families[family]) continue;
      const group = document.createElement('optgroup');
      group.label = family.replaceAll('-', ' ').toUpperCase();
      for (const name of manifest.families[family]) {
        const option = document.createElement('option');
        option.value = `${family}/${name}`;
        option.textContent = name.replaceAll('-', ' ').replace(/\b\w/g, character => character.toUpperCase());
        group.append(option);
      }
      themeSelect.append(group);
    }
    let saved = '';
    try { saved = localStorage.getItem('cybercore-theme') || ''; } catch {}
    themeSelect.value = [...themeSelect.options].some(option => option.value === saved) ? saved : 'cyberpunk/cyberpunk-neon';
    await applyTheme(themeSelect.value);
  }

  const safe = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  function render() {
    const query = search.value.trim().toLowerCase();
    const selected = catalog.filter(doc => {
      const matchesQuery = `${doc.language} ${doc.key} ${doc.group} ${doc.provider} ${doc.summary}`.toLowerCase().includes(query);
      return matchesQuery && (activeFilter === 'all' || doc.provider.toLowerCase() === activeFilter);
    });
    grid.innerHTML = selected.map((doc, index) => {
      const requested = doc.key.toLowerCase() === requestedLanguage;
      const providerLabel = doc.provider === 'DevDocs' ? 'DEV DOCS' : 'OFFICIAL REFERENCE';
      const officialLink = doc.official ? `<a class="docs-secondary-link" href="${safe(doc.official)}" target="_blank" rel="noopener noreferrer">OFFICIAL SOURCE ↗</a>` : '';
      return `<article class="docs-card${requested ? ' is-requested' : ''}" style="--docs-order:${index}"><div class="docs-card-head"><span class="docs-glyph" aria-hidden="true">${safe(doc.language.slice(0,2).toUpperCase())}</span><span class="docs-provider ${doc.provider === 'DevDocs' ? 'provider-devdocs' : 'provider-official'}">${providerLabel}</span></div><p class="docs-group">${safe(doc.group)} / REFERENCE</p><h2>${safe(doc.language)}</h2><p class="docs-summary">${safe(doc.summary)}</p><div class="docs-card-foot"><a class="docs-primary-link" href="${safe(doc.url)}" target="_blank" rel="noopener noreferrer">${doc.provider === 'DevDocs' ? 'OPEN DEV DOCS ↗' : 'OPEN OFFICIAL DOCS ↗'}</a>${officialLink}</div></article>`;
    }).join('');
    count.textContent = `${selected.length.toString().padStart(2,'0')} / ${catalog.length} REFERENCES`;
    empty.hidden = selected.length !== 0;
    grid.hidden = selected.length === 0;
    const active = catalog.find(doc => doc.key.toLowerCase() === requestedLanguage);
    const context = document.querySelector('#docsContext');
    if (active) {
      context.hidden = false;
      document.querySelector('#contextLanguage').textContent = active.language.toUpperCase();
      document.querySelector('#contextProvider').textContent = `${active.provider.toUpperCase()} REFERENCE`;
      document.querySelector('#contextLink').href = active.url;
      document.querySelector('#contextLink').textContent = `OPEN ${active.provider === 'DevDocs' ? 'DEV DOCS' : 'OFFICIAL REFERENCE'} ↗`;
    } else context.hidden = true;
  }

  search.addEventListener('input', render);
  themeSelect.addEventListener('change', () => applyTheme(themeSelect.value).catch(console.error));
  filters.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.docFilter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    render();
  }));
  document.querySelector('#searchDevDocs').addEventListener('click', () => {
    const query = search.value.trim();
    const target = query ? `https://devdocs.io/#q=${encodeURIComponent(query)}` : 'https://devdocs.io/';
    window.open(target, '_blank', 'noopener,noreferrer');
  });
  loadThemes().catch(error => {
    console.warn('Keeping the default Docs Deck palette.', error);
    themeSelect.innerHTML = '<option value="fallback">Cyberpunk Neon</option>';
  });
  render();
})();
