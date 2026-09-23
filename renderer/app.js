'use strict';

(function () {

  const els = {
    activityIcons: document.querySelectorAll('.activity-icon'),
    openFolderBtn: document.getElementById('btn-open-folder'),
    rescanBtn: document.getElementById('btn-rescan'),
    folderDisplay: document.getElementById('folder-display'),
    coursList: document.getElementById('cours-list'),
    emptyState: document.getElementById('empty-state'),
    readerCours: document.getElementById('reader-cours'),
    readerNotions: document.getElementById('reader-notions'),
    pdfView: document.getElementById('pdf-view'),
    pdfContainer: document.getElementById('pdf-container'),
    pdfToolbar: document.getElementById('pdf-toolbar'),
    pdfError: document.getElementById('pdf-error'),
    pdfPrevBtn: document.getElementById('pdf-prev'),
    pdfNextBtn: document.getElementById('pdf-next'),
    pdfPageInfo: document.getElementById('pdf-page-info'),
    pdfZoomInBtn: document.getElementById('pdf-zoom-in'),
    pdfZoomOutBtn: document.getElementById('pdf-zoom-out'),
    pdfZoomLabel: document.getElementById('pdf-zoom-label'),
    pdfFitWidthBtn: document.getElementById('pdf-fit-width'),
    pdfSearchInput: document.getElementById('pdf-search-input'),
    pdfSearchPrevBtn: document.getElementById('pdf-search-prev'),
    pdfSearchNextBtn: document.getElementById('pdf-search-next'),
    pdfSearchCloseBtn: document.getElementById('pdf-search-close'),
    pdfSearchCount: document.getElementById('pdf-search-count'),
    pdfOutlinePanel: document.getElementById('pdf-outline-panel'),
    pdfOutlineList: document.getElementById('pdf-outline-list'),
    notionsSearch: document.getElementById('notions-search'),
    notionsCount: document.getElementById('notions-count'),
    notionGrid: document.getElementById('notion-grid'),
    notionGridMore: document.getElementById('notion-grid-more'),
    notionTabs: document.getElementById('notion-tabs'),
    notionViews: document.getElementById('notion-views'),
    notionsEmptyOpen: document.getElementById('notions-empty-open'),
    notionsFiltersList: document.getElementById('notions-filters-list'),
    notionsTop: document.getElementById('notions-top'),
    notionsSplitter: document.getElementById('notions-splitter')
  };

  const state = {
    section: 'cours',
    scan: null,
    activePdf: null,
    notions: [],
    openNotions: [],
    activeNotionId: null,
    notionFilter: '',
    notionTitleFilter: 'all',
    notionCourseExcluded: new Set(),
    notionEnvExcluded: new Set(),
    notionsListRendered: 0
  };

  const latexRenderCache = new Map();
  const notionViewCache = new Map();

  const ENV_COLORS = {
    df: '#4fc1ff',
    dfprop: '#73c99a',
    prop: '#c586c0',
    tm: '#f4a464',
    lm: '#d7a3f5',
    cor: '#e2a5c4',
    ra: '#a3c4e2',
    re: '#dcdcaa',
    not: '#9ad5c0',
    nt: '#9ad5c0',
    ex: '#ce9178',
    exo: '#d0a4e8',
    qs: '#98c379',
    proof: '#9a9a9a'
  };

  function notionEnvColor(notion) {
    return ENV_COLORS[notion.environment] || '#cccccc';
  }

  function show(el, visible) {
    el.classList.toggle('hidden', !visible);
  }

  function clearElement(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function basename(filePath) {
    const parts = filePath.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1];
  }

  function stripExtension(name) {
    return name.replace(/\.[^.]+$/, '');
  }

  function courseNameToTitle(name) {
    return stripExtension(name).replace(/[-_]/g, ' ');
  }

  const KATEX_FALLBACK_MACROS = {
    '\\Xint': '\\rlap{\\raisebox{0.35em}{\\text{#1}}}\\!\\int',
    '\\XXint': '',
    '\\1': '\\mathbb{1}',
    '\\eqref': '\\text{(#1)}',
    '\\ref': '\\text{#1}',
    '\\qed': '\\square',
    '\\qedhere': '',
    '\\cho': '\\left\\{\\begin{array}{ll}#1\\end{array}\\right.',
    '\\ssi': '\\text{ si et seulement si }',
    '\\vvvert': '\\lVert\\!\\lVert\\!\\lVert',
    '\\mathring': '\\check{#1}'
  };

  function adaptMacroBodyForKatex(name, body) {
    if (name === '\\XXint') {
      return null;
    }
    if (/\\setbox|\\hbox|\\wd0|\\vcenter|\\mathchoice/.test(body)) {
      if (name === '\\Xint') {
        return '\\rlap{\\raisebox{0.35em}{\\text{#1}}}\\!\\int';
      }
      if (name === '\\dashint') {
        return '\\rlap{\\raisebox{0.35em}{\\text{-}}}\\!\\int';
      }
      return null;
    }
    return body;
  }

  function buildKatexMacros(macros) {
    const katexMacros = Object.assign({}, KATEX_FALLBACK_MACROS);
    if (!Array.isArray(macros)) {
      return katexMacros;
    }
    for (const macro of macros) {
      if (!macro || !macro.name || typeof macro.body !== 'string') {
        continue;
      }
      const adapted = adaptMacroBodyForKatex(macro.name, macro.body);
      if (adapted !== null) {
        katexMacros[macro.name] = adapted;
      }
    }
    return katexMacros;
  }

  function getSettingsMacros() {
    return buildKatexMacros(state.scan && state.scan.settings ? state.scan.settings.macros : []);
  }

  function preprocessMath(formula, displayMode) {
    let src = formula;
    src = src.replace(/\\label\s*\{[^}]*\}/g, '');
    src = src.replace(/\\(?:notag|nonumber)\b/g, '');
    if (!displayMode) {
      return src;
    }
    src = src.replace(/\\begin\{displaymath\}([\s\S]*?)\\end\{displaymath\}/g, '$1');
    src = src.replace(
      /\\begin\{(multline\*?|flalign\*?|eqnarray\*?)\}([\s\S]*?)\\end\{\1\}/g,
      (_m, _env, inner) => `\\begin{aligned}${inner}\\end{aligned}`
    );
    return src;
  }

  function renderFormula(formula, displayMode, macros) {
    try {
      return katex.renderToString(preprocessMath(formula, displayMode), {
        displayMode,
        macros: Object.assign({}, macros),
        throwOnError: false
      });
    } catch (err) {
      return `<code class="latex-error">${escapeHtml(formula)}</code>`;
    }
  }

  function applyTextTransforms(html) {
    html = html.replace(/\\begin\{itemize\}(\[[^\]]*\])?/g, '<ul class="tex-list">');
    html = html.replace(/\\end\{itemize\}/g, '</ul>');
    html = html.replace(/\\begin\{enumerate\}(\[[^\]]*\])?/g, '<ol class="tex-list">');
    html = html.replace(/\\end\{enumerate\}/g, '</ol>');
    html = html.replace(/\\item(\[[^\]]*\])?/g, '<li>');
    html = html.replace(/\\begin\{(?:center|flushleft|flushright)\}/g, '');
    html = html.replace(/\\end\{(?:center|flushleft|flushright)\}/g, '');
    html = html.replace(/\\textbf\{([^{}]*)\}/g, '<strong>$1</strong>');
    html = html.replace(/\\(?:emph|textit)\{([^{}]*)\}/g, '<em>$1</em>');
    html = html.replace(/\\underline\{([^{}]*)\}/g, '<u>$1</u>');
    html = html.replace(/\\(?:noindent|hfill|newline|smallskip|medskip|bigskip|strut|clearpage|newpage|centering)\b/g, '');
    html = html.replace(/\\[vh]space\*?\{[^}]*\}/g, '');
    html = html.replace(/\\\\(\[[^\]]*\])?/g, '<br>');
    return html;
  }

  function extractInlineMathSegments(text) {
    const segments = [];
    let current = '';
    let inMath = false;
    let braceDepth = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '\\') {
        current += ch;
        if (i + 1 < text.length) {
          current += text[++i];
        }
        continue;
      }
      if (ch === '{') {
        braceDepth++;
      } else if (ch === '}') {
        braceDepth = Math.max(0, braceDepth - 1);
      }
      if (ch === '$' && braceDepth === 0) {
        if (!inMath) {
          if (current.length > 0) {
            segments.push({ math: false, text: current });
          }
          current = '';
          inMath = true;
          continue;
        }
        if (text[i + 1] === '$') {
          current += '$';
          i++;
          continue;
        }
        segments.push({ math: true, text: current });
        current = '';
        inMath = false;
        continue;
      }
      if (!inMath && ch === '\n' && current.includes('$')) {
        continue;
      }
      current += ch;
    }
    if (current.length > 0) {
      segments.push({ math: inMath, text: current });
    }
    return segments;
  }

  function getTextMacroReplacements(macros) {
    const entries = [];
    if (!macros) {
      return entries;
    }
    for (const [name, body] of Object.entries(macros)) {
      if (typeof body !== 'string' || body.includes('#')) {
        continue;
      }
      const match = body.match(/^\s*\\text\{([^{}]*)\}\s*$/);
      if (match) {
        entries.push({ name, text: match[1] });
      }
    }
    return entries;
  }

  function renderLatexText(text, macros) {
    if (!text) {
      return '';
    }
    const segments = extractInlineMathSegments(text);
    const mathSpans = [];
    const protectedText = segments.map((seg) => {
      if (seg.math) {
        mathSpans.push(seg.text);
        return `\u0000${mathSpans.length - 1}\u0000`;
      }
      return seg.text;
    }).join('');
    let plainText = protectedText;
    for (const { name, text: macroText } of getTextMacroReplacements(macros)) {
      const re = new RegExp(`${name.replace(/\\/g, '\\\\')}(?![a-zA-Z])`, 'g');
      plainText = plainText.replace(re, macroText);
    }
    let html = applyTextTransforms(escapeHtml(plainText));
    html = html.replace(/\u0000(\d+)\u0000/g, (_m, i) => renderFormula(mathSpans[Number(i)], false, macros));
    return html;
  }

  const RAW_ENV_RE = /\\begin\{(tikzpicture|tabular\*?|figure\*?|table\*?)\}([\s\S]*?)\\end\{\1\}/g;
  const DISPLAY_BLOCK_RE = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]|\\begin\{(align\*?|gather\*?|equation\*?|displaymath)\}([\s\S]*?)\\end\{\3\}/g;

  function renderLatexBody(body, macros) {
    const container = document.createElement('div');
    container.className = 'notion-body';
    if (!body) {
      return container;
    }
    const displayBlocks = [];
    const rawBlocks = [];
    let src = body.replace(RAW_ENV_RE, (m) => {
      rawBlocks.push(m);
      return `\u0001R${rawBlocks.length - 1}\u0001`;
    });
    src = src.replace(DISPLAY_BLOCK_RE, (m, dd, br, env, inner) => {
      const formula = dd !== undefined ? dd
        : br !== undefined ? br
          : env === 'displaymath' ? inner : `\\begin{${env}}${inner}\\end{${env}}`;
      displayBlocks.push(formula);
      return `\u0001D${displayBlocks.length - 1}\u0001`;
    });
    const paragraphs = src
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p>${renderLatexText(p, macros)}</p>`);
    let html = paragraphs.join('');
    html = html.replace(/\u0001D(\d+)\u0001/g, (_m, i) => renderFormula(displayBlocks[Number(i)], true, macros));
    html = html.replace(/\u0001R(\d+)\u0001/g, (_m, i) => `<pre class="tex-raw">${escapeHtml(rawBlocks[Number(i)])}</pre>`);
    container.innerHTML = html;
    return container;
  }

  function notionToLatex(notion) {
    const args = Array.isArray(notion.args) ? notion.args : [];
    const argText = args.map((arg) => `{${arg}}`).join('');
    return `\\begin{${notion.environment}}${argText}\n${notion.body}\n\\end{${notion.environment}}`;
  }

  /* ---------- Sidebar lists ---------- */

  function buildListItem(item) {
    const div = document.createElement('div');
    div.className = 'item';
    if (item.active) {
      div.classList.add('active');
    }
    const icon = document.createElement('span');
    icon.className = 'item-icon';
    icon.textContent = item.icon || '•';
    const label = document.createElement('span');
    label.className = 'item-label';
    label.textContent = item.label;
    div.appendChild(icon);
    div.appendChild(label);
    if (item.count !== undefined) {
      const count = document.createElement('span');
      count.className = 'item-count';
      count.textContent = item.count;
      div.appendChild(count);
    }
    if (item.title) {
      div.title = item.title;
    }
    div.addEventListener('click', () => {
      if (item.onClick) {
        item.onClick();
      }
    });
    return div;
  }

  function buildGroupHeader(labelText, count, onToggleAll, allActive) {
    const header = document.createElement('div');
    header.className = 'item-group-header';
    const label = document.createElement('span');
    label.textContent = labelText;
    header.appendChild(label);
    if (count !== undefined) {
      const countSpan = document.createElement('span');
      countSpan.className = 'item-count';
      countSpan.textContent = count;
      header.appendChild(countSpan);
    }
    if (onToggleAll) {
      const toggleAll = document.createElement('button');
      toggleAll.className = 'filter-toggle-all' + (allActive ? '' : ' some-off');
      toggleAll.type = 'button';
      toggleAll.textContent = allActive ? '\u2713' : '\u2713?';
      toggleAll.title = allActive ? 'Tout désactiver' : 'Tout activer';
      toggleAll.addEventListener('click', (event) => {
        event.stopPropagation();
        onToggleAll();
      });
      header.appendChild(toggleAll);
    }
    return header;
  }

  function buildEmptyItem(text) {
    const div = document.createElement('div');
    div.className = 'list-empty';
    div.textContent = text;
    return div;
  }

  function renderSidebar() {
    clearElement(els.coursList);

    if (!state.scan) {
      els.coursList.appendChild(buildEmptyItem('Sélectionnez un dossier'));
      return;
    }

    const pdfFiles = Array.isArray(state.scan.pdfFiles) ? state.scan.pdfFiles : [];
    if (pdfFiles.length === 0) {
      els.coursList.appendChild(buildEmptyItem('Aucun PDF trouvé'));
    } else {
      els.coursList.appendChild(buildGroupHeader('Cours PDF', pdfFiles.length));
      pdfFiles.forEach((filePath) => {
        const name = basename(filePath);
        els.coursList.appendChild(
          buildListItem({
            icon: 'PDF',
            label: courseNameToTitle(name),
            title: filePath,
            active: state.activePdf === filePath,
            onClick: () => openPdf(filePath)
          })
        );
      });
    }

    renderNotionsFilters();
    renderNotionsGrid();
  }

  const foldedCache = new Map();

  function fold(text) {
    if (!text) {
      return '';
    }
    let folded = foldedCache.get(text);
    if (folded === undefined) {
      folded = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (foldedCache.size > 5000) {
        foldedCache.clear();
      }
      foldedCache.set(text, folded);
    }
    return folded;
  }

  function getFilteredNotions() {
    const q = fold(state.notionFilter);
    const titleFilter = state.notionTitleFilter;
    const excluded = state.notionCourseExcluded;
    return state.notions.filter((notion) => {
      if (titleFilter === 'titled' && !notion.hasTitle) {
        return false;
      }
      if (titleFilter === 'untitled' && notion.hasTitle) {
        return false;
      }
      if (excluded.has(notion.course)) {
        return false;
      }
      if (state.notionEnvExcluded.size > 0 && state.notionEnvExcluded.has(notion.environment)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return fold(notion.title).includes(q)
        || fold(notion.environmentDisplay).includes(q)
        || fold(notion.course).includes(q);
    });
  }

  function getNotionCourses() {
    const courses = new Set();
    for (const notion of state.notions) {
      courses.add(notion.course);
    }
    return Array.from(courses).sort((a, b) => a.localeCompare(b, 'fr'));
  }

  function buildFilterCheckItem(label, checked, onToggle) {
    const div = document.createElement('div');
    div.className = 'filter-item';
    if (!checked) {
      div.classList.add('filtered');
      div.style.opacity = '0.55';
    }
    const check = document.createElement('span');
    check.className = 'item-check';
    check.textContent = checked ? '\u2713' : '';
    const labelText = document.createElement('span');
    labelText.className = 'item-label';
    labelText.textContent = label;
    div.appendChild(check);
    div.appendChild(labelText);
    div.addEventListener('click', onToggle);
    return div;
  }

  function buildFilterSelect(value, options, onChange) {
    const select = document.createElement('select');
    select.className = 'filter-select';
    for (const opt of options) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      select.appendChild(option);
    }
    select.value = value;
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }

  function getNotionEnvironments() {
    const map = new Map();
    for (const notion of state.notions) {
      if (!map.has(notion.environment)) {
        map.set(notion.environment, notion.environmentDisplay || notion.environment);
      }
    }
    return Array.from(map.entries())
      .map(([env, display]) => ({ env, display }))
      .sort((a, b) => a.display.localeCompare(b.display, 'fr'));
  }

  function renderNotionsFilters() {
    if (!els.notionsFiltersList) {
      return;
    }
    clearElement(els.notionsFiltersList);

    const envs = getNotionEnvironments();
    els.notionsFiltersList.appendChild(
      buildGroupHeader('Type de Notions', envs.length, () => {
        if (state.notionEnvExcluded.size > 0) {
          state.notionEnvExcluded.clear();
        } else {
          for (const entry of envs) {
            state.notionEnvExcluded.add(entry.env);
          }
        }
        resetNotionsGridPagination();
        renderNotionsFilters();
        renderNotionsGrid();
      }, envs.length > 0 && state.notionEnvExcluded.size === 0)
    );
    for (const entry of envs) {
      const included = !state.notionEnvExcluded.has(entry.env);
      els.notionsFiltersList.appendChild(
        buildFilterCheckItem(entry.display, included, () => {
          if (state.notionEnvExcluded.has(entry.env)) {
            state.notionEnvExcluded.delete(entry.env);
          } else {
            state.notionEnvExcluded.add(entry.env);
          }
          resetNotionsGridPagination();
          renderNotionsFilters();
          renderNotionsGrid();
        })
      );
    }

    const titleLabels = [
      { value: 'all', label: 'Toutes' },
      { value: 'titled', label: 'Nommées' },
      { value: 'untitled', label: 'Anonymes' }
    ];
    els.notionsFiltersList.appendChild(buildGroupHeader('Nom', undefined));
    els.notionsFiltersList.appendChild(
      buildFilterSelect(state.notionTitleFilter, titleLabels, (value) => {
        state.notionTitleFilter = value;
        resetNotionsGridPagination();
        renderNotionsGrid();
      })
    );

    const courses = getNotionCourses();
    els.notionsFiltersList.appendChild(
      buildGroupHeader('Matières', courses.length, () => {
        if (state.notionCourseExcluded.size > 0) {
          state.notionCourseExcluded.clear();
        } else {
          for (const course of courses) {
            state.notionCourseExcluded.add(course);
          }
        }
        resetNotionsGridPagination();
        renderNotionsFilters();
        renderNotionsGrid();
      }, courses.length > 0 && state.notionCourseExcluded.size === 0)
    );
    if (courses.length === 0) {
      els.notionsFiltersList.appendChild(buildEmptyItem('Aucune matière'));
    } else {
      for (const course of courses) {
        const included = !state.notionCourseExcluded.has(course);
        els.notionsFiltersList.appendChild(
          buildFilterCheckItem(courseNameToTitle(course), included, () => {
            if (state.notionCourseExcluded.has(course)) {
              state.notionCourseExcluded.delete(course);
            } else {
              state.notionCourseExcluded.add(course);
            }
            resetNotionsGridPagination();
            renderNotionsFilters();
            renderNotionsGrid();
          })
        );
      }
    }
  }

  function buildNotionCard(notion) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'notion-card';
    if (state.activeNotionId === notion.id) {
      card.classList.add('active');
    }
    card.dataset.notionId = notion.id;
    const label = document.createElement('span');
    label.className = 'notion-card-label';
    label.textContent = notion.title;
    label.style.color = notionEnvColor(notion);
    label.title = `${notion.environmentDisplay} — ${courseNameToTitle(notion.course)}`;
    card.appendChild(label);
    if (notion.proofs.length > 0) {
      const proofBadge = document.createElement('span');
      proofBadge.className = 'notion-card-proof-badge';
      proofBadge.textContent = '✓';
      proofBadge.title = 'Avec démonstration';
      card.appendChild(proofBadge);
    }
    card.addEventListener('click', () => openNotion(notion));
    return card;
  }

  function getUniqueNotions(notions) {
    const seen = new Set();
    const unique = [];
    for (const notion of notions) {
      if (seen.has(notion.id)) {
        continue;
      }
      seen.add(notion.id);
      unique.push(notion);
    }
    return unique;
  }

  function renderNotionsGrid() {
    if (!els.notionGrid) {
      return;
    }
    const filtered = getUniqueNotions(getFilteredNotions());
    const visibleNotions = filtered.slice(0, state.notionsListRendered);
    clearElement(els.notionGrid);
    const frag = document.createDocumentFragment();
    for (const notion of visibleNotions) {
      frag.appendChild(buildNotionCard(notion));
    }
    els.notionGrid.appendChild(frag);
    if (els.notionGridMore) {
      const remaining = filtered.length - visibleNotions.length;
      show(els.notionGridMore, remaining > 0);
      if (remaining > 0) {
        els.notionGridMore.textContent = `Afficher ${Math.min(200, remaining)} de plus (${remaining} restantes)`;
      }
    }
    if (els.notionsCount) {
      els.notionsCount.textContent = `${filtered.length} notions`;
    }
  }

  function updateNotionCardStates() {
    els.notionGrid.querySelectorAll('.notion-card').forEach((card) => {
      card.classList.toggle('active', card.dataset.notionId === state.activeNotionId);
    });
  }

  function showMoreNotions() {
    state.notionsListRendered += 200;
    renderNotionsGrid();
  }

  function resetNotionsGridPagination() {
    state.notionsListRendered = 200;
  }

  function switchSection(section) {
    state.section = section;
    for (const btn of els.activityIcons) {
      btn.classList.toggle('active', btn.dataset.section === section);
    }
    show(els.coursList, section === 'cours');
    show(els.notionsFiltersList, section === 'notions');
    updateMainView();
  }

  function updateMainView() {
    if (!state.scan) {
      show(els.emptyState, true);
      show(els.readerCours, false);
      show(els.readerNotions, false);
      return;
    }
    show(els.emptyState, false);
    if (state.section === 'cours') {
      show(els.readerCours, true);
      show(els.readerNotions, false);
    } else {
      show(els.readerCours, false);
      show(els.readerNotions, true);
    }
  }

  /* ---------- Folder & scan ---------- */

  async function openFolderDialog() {
    const result = await window.api.selectFolder();
    if (!result.canceled && result.folder) {
      await rescan();
    }
  }

  async function rescan(options) {
    const opts = options || {};
    const result = await window.api.scanFolder();
    if (result.error) {
      if (result.error === 'no-folder') {
        els.folderDisplay.textContent = 'Aucun dossier sélectionné';
        els.folderDisplay.title = '';
        return;
      }
      els.folderDisplay.textContent = `Erreur : ${result.error}`;
      return;
    }
    const previousNotions = state.notions;
    const previousOpenIds = state.openNotions.map((n) => n.id);
    const previousActiveId = state.activeNotionId;
    const previousPdf = state.activePdf;
    const previousPdfPage = currentPdfPage();

    state.scan = result;
    state.notions = Array.isArray(result.notions) ? result.notions : [];
    latexRenderCache.clear();
    notionViewCache.clear();

    if (opts.preserve) {
      const stillExists = (id) => state.notions.some((n) => n.id === id);
      state.openNotions = previousOpenIds
        .map((id) => {
          const updated = state.notions.find((n) => n.id === id);
          return updated || previousNotions.find((n) => n.id === id);
        })
        .filter((n) => n && stillExists(n.id));
      state.activeNotionId = stillExists(previousActiveId) ? previousActiveId
        : (state.openNotions[0] ? state.openNotions[0].id : null);
      if (!Array.isArray(result.pdfFiles) || !result.pdfFiles.includes(previousPdf)) {
        state.activePdf = null;
        resetPdfViewer();
        show(els.pdfToolbar, false);
        show(els.pdfContainer, false);
      } else if (opts.reloadPdf && previousPdf) {
        state.activePdf = null;
        await openPdf(previousPdf).then(() => {
          goToPdfPage(previousPdfPage);
        });
      } else {
        state.activePdf = previousPdf;
      }
    } else {
      state.activePdf = null;
      state.openNotions = [];
      state.activeNotionId = null;
      state.notionCourseExcluded = new Set();
      state.notionEnvExcluded = new Set();
      resetPdfViewer();
      show(els.pdfToolbar, false);
      show(els.pdfContainer, false);
    }
    resetNotionsGridPagination();
    els.folderDisplay.textContent = result.folder;
    els.folderDisplay.title = result.folder;
    renderSidebar();
    renderNotionTabs();
    renderNotionViews();
    updateMainView();
  }

  function currentPdfPage() {
    const visible = Array.from(pdfViewer.visiblePages).sort((a, b) => a - b);
    return visible.length > 0 ? visible[0] : 1;
  }

  /* ---------- PDF viewer (pdf.js embarqué) ---------- */

  const pdfViewer = {
    doc: null,
    pageCount: 0,
    scale: null,
    fitWidth: true,
    renderedPages: new Set(),
    pageJobs: new Map(),
    visiblePages: new Set(),
    outline: null,
    outlineFlat: [],
    basePageWidth: null,
    basePageHeight: null,
    lastWheelZoomAt: 0,
    search: {
      query: '',
      running: false,
      matches: [],
      current: -1,
      searchId: 0
    }
  };

  function resetPdfViewer() {
    resetPdfSearch();
    if (pdfViewer.doc) {
      try {
        pdfViewer.doc.destroy();
      } catch (err) {
        /* document déjà fermé */
      }
    }
    pdfViewer.doc = null;
    pdfViewer.pageCount = 0;
    pdfViewer.scale = null;
    pdfViewer.renderedPages = new Set();
    pdfViewer.pageJobs = new Map();
    pdfViewer.visiblePages = new Set();
    pdfViewer.outline = null;
    pdfViewer.outlineFlat = [];
    pdfViewer.basePageWidth = null;
    pdfViewer.basePageHeight = null;
    clearElement(els.pdfView);
  }

  function updatePdfPageInfo() {
    const visible = Array.from(pdfViewer.visiblePages).sort((a, b) => a - b);
    const current = visible.length > 0 ? visible[0] : '–';
    els.pdfPageInfo.textContent = `${current} / ${pdfViewer.pageCount || '–'}`;
  }

  function updateZoomLabel() {
    els.pdfZoomLabel.textContent = pdfViewer.scale
      ? `${Math.round(pdfViewer.scale * 100)} %`
      : '–';
  }

  async function resolvePdfDestination(dest) {
    const doc = pdfViewer.doc;
    if (!doc || !dest) {
      return null;
    }
    let explicit = dest;
    if (typeof dest === 'string') {
      explicit = await doc.getDestination(dest);
      if (!explicit) {
        return null;
      }
    }
    if (!Array.isArray(explicit) || explicit.length === 0) {
      return null;
    }
    let y = null;
    const kind = explicit[1];
    if (Array.isArray(kind) && kind.length >= 2) {
      y = kind[3];
    } else if (kind && typeof kind === 'object' && 'name' in kind) {
      if (kind.name === 'XYZ' && explicit.length >= 4) {
        y = explicit[3];
      }
    }
    try {
      const pageIndex = await doc.getPageIndex(explicit[0]);
      return { pageNum: pageIndex + 1, y: typeof y === 'number' ? y : null };
    } catch (err) {
      return null;
    }
  }

  async function goToPdfDestination(dest) {
    const target = await resolvePdfDestination(dest);
    if (!target) {
      return;
    }
    const pageDiv = els.pdfView.querySelector(`[data-page-num="${target.pageNum}"]`);
    if (!pageDiv) {
      return;
    }
    const containerRect = els.pdfContainer.getBoundingClientRect();
    const pageRect = pageDiv.getBoundingClientRect();
    const viewport = (await pdfViewer.doc.getPage(target.pageNum)).getViewport({ scale: pdfViewer.scale });
    let offset = pageRect.top - containerRect.top - 8;
    if (target.y !== null) {
      const pageHeight = pageRect.height || viewport.height;
      const yRatio = Math.min(Math.max(target.y / viewport.height, 0), 1);
      offset += (1 - yRatio) * pageHeight;
    }
    els.pdfContainer.scrollTop += offset;
  }

  async function renderPdfAnnotations(page, pageDiv, viewport) {
    let annotations;
    try {
      annotations = await page.getAnnotations({ intent: 'display' });
    } catch (err) {
      return;
    }
    const links = (annotations || []).filter((a) => a.subtype === 'Link');
    if (links.length === 0) {
      return;
    }
    let layer = pageDiv.querySelector('.annotationLayer');
    if (!layer) {
      layer = document.createElement('div');
      layer.className = 'annotationLayer';
      pageDiv.appendChild(layer);
    }
    clearElement(layer);
    for (const link of links) {
      if (!Array.isArray(link.rect) || link.rect.length !== 4) {
        continue;
      }
      const [x1, y1, x2, y2] = link.rect;
      const left = viewport.convertToViewportPoint(x1, y2);
      const right = viewport.convertToViewportPoint(x2, y1);
      const anchor = document.createElement('a');
      anchor.className = 'pdf-link';
      anchor.setAttribute('data-annotation-id', String(link.id || ''));
      const leftX = Math.min(left[0], right[0]);
      const topY = Math.min(left[1], right[1]);
      const width = Math.abs(right[0] - left[0]);
      const height = Math.abs(right[1] - left[1]);
      anchor.style.left = `${leftX}px`;
      anchor.style.top = `${topY}px`;
      anchor.style.width = `${Math.max(width, 6)}px`;
      anchor.style.height = `${Math.max(height, 6)}px`;
      if (link.url) {
        anchor.href = link.url;
        anchor.title = link.url;
        anchor.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          window.api.openExternal(link.url);
        });
      } else if (link.dest) {
        anchor.href = '#';
        anchor.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          goToPdfDestination(link.dest);
        });
      } else if (link.action) {
        anchor.href = '#';
        anchor.title = 'action';
        const actionName = link.action && link.action.name ? link.action.name : null;
        if (actionName === 'GoTo' && link.action.destination) {
          anchor.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            goToPdfDestination(link.action.destination);
          });
        }
      }
      layer.appendChild(anchor);
    }
  }

  async function renderPdfPage(pageNum, viewportScale) {
    const doc = pdfViewer.doc;
    const pageDiv = els.pdfView.querySelector(`[data-page-num="${pageNum}"]`);
    if (!doc || !pageDiv || pageDiv.dataset.rendered === '1') {
      return;
    }
    const existing = pdfViewer.pageJobs.get(pageNum);
    if (existing) {
      await existing;
      return;
    }
    const job = (async () => {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: viewportScale });
      const canvas = pageDiv.querySelector('canvas');
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * ratio);
      canvas.height = Math.floor(viewport.height * ratio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      const renderOptions = { canvasContext: context, viewport };
      if (ratio !== 1) {
        renderOptions.transform = [ratio, 0, 0, ratio, 0, 0];
      }
      await page.render(renderOptions).promise;
      pageDiv.dataset.rendered = '1';
      pdfViewer.renderedPages.add(pageNum);
      try {
        const textLayerDiv = pageDiv.querySelector('.textLayer');
        if (textLayerDiv) {
          textLayerDiv.style.setProperty('--scale-factor', String(viewportScale));
          const textContent = await page.getTextContent();
          const task = pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport: viewport,
            textDivs: []
          });
          await task.promise;
        }
      } catch (err) {
        /* la couche texte est optionnelle, le canvas reste affiché */
      }
      try {
        await renderPdfAnnotations(page, pageDiv, viewport);
      } catch (err) {
        /* la couche d'annotations est optionnelle */
      }
    })();
    pdfViewer.pageJobs.set(pageNum, job);
    try {
      await job;
    } finally {
      pdfViewer.pageJobs.delete(pageNum);
    }
  }

  async function buildPdfPagePlaceholders() {
    clearElement(els.pdfView);
    const firstPage = await pdfViewer.doc.getPage(1);
    const baseViewport = firstPage.getViewport({ scale: pdfViewer.scale });
    for (let pageNum = 1; pageNum <= pdfViewer.pageCount; pageNum++) {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page';
      pageDiv.dataset.pageNum = String(pageNum);
      pageDiv.style.width = `${Math.floor(baseViewport.width)}px`;
      pageDiv.style.height = `${Math.floor(baseViewport.height)}px`;
      const canvas = document.createElement('canvas');
      canvas.width = 0;
      canvas.height = 0;
      pageDiv.appendChild(canvas);
      const textLayer = document.createElement('div');
      textLayer.className = 'textLayer';
      pageDiv.appendChild(textLayer);
      els.pdfView.appendChild(pageDiv);
    }
  }

  function getFitWidthScale() {
    if (!pdfViewer.doc || !pdfViewer.basePageWidth) {
      return null;
    }
    const available = Math.max(els.pdfView.clientWidth - 32, 200);
    return Math.min(Math.max(available / pdfViewer.basePageWidth, 0.2), 5);
  }

  function computeFitWidthScale() {
    const scale = getFitWidthScale();
    if (scale !== null) {
      pdfViewer.scale = scale;
    }
  }

  function updateVisiblePages() {
    const containerRect = els.pdfContainer.getBoundingClientRect();
    const visible = new Set();
    const toRender = [];
    els.pdfView.querySelectorAll('.pdf-page').forEach((pageDiv) => {
      const rect = pageDiv.getBoundingClientRect();
      if (rect.bottom >= containerRect.top - 400 && rect.top <= containerRect.bottom + 400) {
        const pageNum = Number(pageDiv.dataset.pageNum);
        visible.add(pageNum);
        if (pageDiv.dataset.rendered !== '1') {
          toRender.push(pageNum);
        }
      }
    });
    pdfViewer.visiblePages = visible;
    updatePdfPageInfo();
    updateOutlineActive();
    for (const pageNum of toRender) {
      renderPdfPage(pageNum, pdfViewer.scale);
    }
  }

  function scheduleVisibleUpdate() {
    requestAnimationFrame(updateVisiblePages);
  }

  async function rerenderAllPages() {
    els.pdfView.querySelectorAll('.pdf-page').forEach((pageDiv) => {
      pageDiv.dataset.rendered = '';
      const canvas = pageDiv.querySelector('canvas');
      canvas.width = 0;
      canvas.height = 0;
      const textLayer = pageDiv.querySelector('.textLayer');
      if (textLayer) {
        clearElement(textLayer);
      }
      const annotationLayer = pageDiv.querySelector('.annotationLayer');
      if (annotationLayer) {
        clearElement(annotationLayer);
      }
    });
    pdfViewer.renderedPages = new Set();
    scheduleVisibleUpdate();
  }

  function goToPdfPage(pageNum) {
    const pageDiv = els.pdfView.querySelector(`[data-page-num="${pageNum}"]`);
    if (!pageDiv) {
      return;
    }
    const containerRect = els.pdfContainer.getBoundingClientRect();
    const pageRect = pageDiv.getBoundingClientRect();
    els.pdfContainer.scrollTop += pageRect.top - containerRect.top - 8;
  }

  /* ---------- Recherche texte dans le PDF ---------- */

  function resetPdfSearch() {
    pdfViewer.search.searchId++;
    pdfViewer.search.running = false;
    pdfViewer.search.matches = [];
    pdfViewer.search.current = -1;
    updatePdfSearchUi(false);
  }

  function clearPdfHighlights() {
    els.pdfView.querySelectorAll('.pdf-highlight-overlay').forEach((div) => {
      div.remove();
    });
  }

  function getSearchQuery() {
    return (els.pdfSearchInput.value || '').trim();
  }

  function updatePdfSearchUi(visible) {
    const hasQuery = getSearchQuery().length > 0;
    const showControls = visible && hasQuery;
    show(els.pdfSearchPrevBtn, showControls);
    show(els.pdfSearchNextBtn, showControls);
    show(els.pdfSearchCloseBtn, hasQuery);
    show(els.pdfSearchCount, showControls);
    if (!showControls) {
      return;
    }
    if (pdfViewer.search.matches.length === 0) {
      els.pdfSearchCount.textContent = '0 résultat';
    } else {
      els.pdfSearchCount.textContent = `${pdfViewer.search.current + 1} / ${pdfViewer.search.matches.length}`;
    }
  }

  async function buildPdfSearchIndex(query) {
    const folded = fold(query);
    const matches = [];
    for (let pageNum = 1; pageNum <= pdfViewer.pageCount; pageNum++) {
      let content;
      try {
        const page = await pdfViewer.doc.getPage(pageNum);
        content = await page.getTextContent();
      } catch (err) {
        continue;
      }
      for (const item of content.items) {
        if (typeof item.str !== 'string' || !item.str) {
          continue;
        }
        const start = fold(item.str).indexOf(folded);
        if (start === -1) {
          continue;
        }
        matches.push({
          pageNum,
          transform: item.transform,
          width: item.width,
          height: item.height,
          str: item.str,
          start
        });
      }
    }
    return matches;
  }

  function renderPdfSearchResults() {
    clearPdfHighlights();
    const current = pdfViewer.search.current;
    pdfViewer.search.matches.forEach((match, index) => {
      const pageDiv = els.pdfView.querySelector(`[data-page-num="${match.pageNum}"]`);
      if (!pageDiv) {
        return;
      }
      let overlay = pageDiv.querySelector('.pdf-highlight-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'pdf-highlight-overlay';
        pageDiv.appendChild(overlay);
      }
      const scale = pdfViewer.scale || 1;
      const span = document.createElement('span');
      span.className = index === current ? 'current' : '';
      span.style.left = `${match.transform[4] * scale}px`;
      span.style.top = `${(match.transform[5] - match.height) * scale}px`;
      span.style.width = `${match.width * scale}px`;
      span.style.height = `${match.height * scale}px`;
      overlay.appendChild(span);
    });
  }

  function goToPdfSearchMatch(index) {
    const matches = pdfViewer.search.matches;
    if (matches.length === 0) {
      return;
    }
    const bounded = ((index % matches.length) + matches.length) % matches.length;
    pdfViewer.search.current = bounded;
    renderPdfSearchResults();
    updatePdfSearchUi(true);
    goToPdfPage(matches[bounded].pageNum);
  }

  async function runPdfSearch() {
    const query = getSearchQuery();
    pdfViewer.search.searchId++;
    const searchId = pdfViewer.search.searchId;
    if (!query || !pdfViewer.doc) {
      pdfViewer.search.matches = [];
      pdfViewer.search.current = -1;
      pdfViewer.search.running = false;
      clearPdfHighlights();
      updatePdfSearchUi(false);
      return;
    }
    pdfViewer.search.running = true;
    pdfViewer.search.query = query;
    els.pdfSearchCount.textContent = 'Recherche…';
    show(els.pdfSearchCount, true);
    const matches = await buildPdfSearchIndex(query);
    if (searchId !== pdfViewer.search.searchId || !pdfViewer.doc) {
      return;
    }
    pdfViewer.search.matches = matches;
    pdfViewer.search.current = matches.length > 0 ? 0 : -1;
    pdfViewer.search.running = false;
    renderPdfSearchResults();
    updatePdfSearchUi(true);
    if (matches.length > 0) {
      goToPdfPage(matches[0].pageNum);
    }
  }

  let pdfSearchTimer = null;

  function schedulePdfSearch() {
    clearTimeout(pdfSearchTimer);
    pdfSearchTimer = setTimeout(() => {
      runPdfSearch();
    }, 300);
  }

  function clearPdfSearch() {
    clearTimeout(pdfSearchTimer);
    els.pdfSearchInput.value = '';
    pdfViewer.search.searchId++;
    pdfViewer.search.matches = [];
    pdfViewer.search.current = -1;
    pdfViewer.search.running = false;
    clearPdfHighlights();
    updatePdfSearchUi(false);
  }

  function refreshPdfSearchHighlights() {
    if (pdfViewer.search.matches.length > 0) {
      renderPdfSearchResults();
    }
  }

  els.pdfSearchInput.addEventListener('input', schedulePdfSearch);
  els.pdfSearchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (pdfViewer.search.running) {
        return;
      }
      if (pdfViewer.search.matches.length === 0 && getSearchQuery()) {
        runPdfSearch();
      } else if (event.shiftKey) {
        goToPdfSearchMatch(pdfViewer.search.current - 1);
      } else {
        goToPdfSearchMatch(pdfViewer.search.current + 1);
      }
    }
    if (event.key === 'Escape') {
      clearPdfSearch();
    }
  });
  els.pdfSearchNextBtn.addEventListener('click', () => {
    goToPdfSearchMatch(pdfViewer.search.current + 1);
  });
  els.pdfSearchPrevBtn.addEventListener('click', () => {
    goToPdfSearchMatch(pdfViewer.search.current - 1);
  });
  els.pdfSearchCloseBtn.addEventListener('click', clearPdfSearch);

  /* ---------- Sommaire (outline) : interactif, suivi de lecture ---------- */

  async function resolveOutlinePositions() {
    const flat = [];
    const walk = async (items, depth) => {
      for (const item of (items || [])) {
        const target = item.dest ? await resolvePdfDestination(item.dest) : null;
        flat.push({ item, depth, pageNum: target ? target.pageNum : null, y: target ? target.y : null });
        if (Array.isArray(item.items) && item.items.length > 0) {
          await walk(item.items, depth + 1);
        }
      }
    };
    await walk(pdfViewer.outline, 0);
    flat.sort((a, b) => {
      if (a.pageNum === null && b.pageNum === null) return 0;
      if (a.pageNum === null) return 1;
      if (b.pageNum === null) return -1;
      if (a.pageNum !== b.pageNum) return a.pageNum - b.pageNum;
      const ay = a.y === null ? 0 : a.y;
      const by = b.y === null ? 0 : b.y;
      return by - ay;
    });
    pdfViewer.outlineFlat = flat;
  }

  function buildOutlineNode(entry) {
    const li = document.createElement('li');
    li.className = 'outline-item depth-' + entry.depth;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'outline-link';
    btn.textContent = entry.item.title || 'Sans titre';
    btn.title = entry.item.title || '';
    btn.setAttribute('data-outline-index', String(entry.index));
    btn.addEventListener('click', () => {
      if (entry.item.dest) {
        goToPdfDestination(entry.item.dest);
      } else if (entry.item.url) {
        window.api.openExternal(entry.item.url);
      }
    });
    li.appendChild(btn);
    return li;
  }

  function renderPdfOutline() {
    clearElement(els.pdfOutlineList);
    const entries = pdfViewer.outlineFlat;
    const hasOutline = !!pdfViewer.doc && entries.length > 0;
    show(els.pdfOutlinePanel, hasOutline);
    if (!hasOutline) {
      return;
    }
    entries.forEach((entry, index) => {
      entry.index = index;
      els.pdfOutlineList.appendChild(buildOutlineNode(entry));
    });
  }

  function updateOutlineActive() {
    if (!pdfViewer.outlineFlat.length) {
      return;
    }
    const pageHeight = (pdfViewer.basePageHeight || 0) * (pdfViewer.scale || 1);
    const pageStep = pageHeight + 12;
    const scrollTop = els.pdfContainer.scrollTop + 8;
    let activeIndex = -1;
    for (const entry of pdfViewer.outlineFlat) {
      if (entry.pageNum === null) {
        continue;
      }
      let yRatio = 0;
      if (entry.y !== null && pdfViewer.basePageHeight) {
        yRatio = Math.min(Math.max(entry.y / pdfViewer.basePageHeight, 0), 1);
      }
      const pos = (entry.pageNum - 1) * pageStep + 16 + (1 - yRatio) * pageHeight;
      if (pos <= scrollTop) {
        activeIndex = entry.index;
      } else {
        break;
      }
    }
    els.pdfOutlineList.querySelectorAll('.outline-link').forEach((btn) => {
      btn.classList.toggle('active', Number(btn.dataset.outlineIndex) === activeIndex);
    });
    const activeBtn = els.pdfOutlineList.querySelector('.outline-link.active');
    if (activeBtn && els.pdfOutlinePanel && !els.pdfOutlinePanel.contains(document.activeElement)) {
      const panelRect = els.pdfOutlinePanel.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      if (btnRect.top < panelRect.top || btnRect.bottom > panelRect.bottom) {
        activeBtn.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  /* ---------- Ouverture et zoom ---------- */

  async function openPdf(filePath) {
    state.activePdf = filePath;
    show(els.pdfError, false);
    show(els.pdfToolbar, true);
    show(els.pdfContainer, true);
    resetPdfViewer();
    const result = await window.api.readPdf(filePath);
    if (!state.activePdf || state.activePdf !== filePath) {
      return;
    }
    if (result.error) {
      show(els.pdfToolbar, false);
      show(els.pdfContainer, false);
      els.pdfError.textContent = `Impossible d'ouvrir le PDF : ${result.error}`;
      show(els.pdfError, true);
      return;
    }
    const bytes = new Uint8Array(result.data, result.byteOffset || 0, result.byteLength);
    try {
      const task = pdfjsLib.getDocument({ data: bytes });
      pdfViewer.doc = await task.promise;
    } catch (err) {
      show(els.pdfToolbar, false);
      show(els.pdfContainer, false);
      els.pdfError.textContent = `PDF invalide ou corrompu : ${err.message || err}`;
      show(els.pdfError, true);
      return;
    }
    pdfViewer.pageCount = pdfViewer.doc.numPages;
    pdfViewer.fitWidth = true;
    try {
      pdfViewer.outline = (await pdfViewer.doc.getOutline()) || [];
    } catch (err) {
      pdfViewer.outline = [];
    }
    const firstPage = await pdfViewer.doc.getPage(1);
    const baseViewport = firstPage.getViewport({ scale: 1 });
    pdfViewer.basePageWidth = baseViewport.width;
    pdfViewer.basePageHeight = baseViewport.height;
    await resolveOutlinePositions();
    renderPdfOutline();
    computeFitWidthScale();
    updateZoomLabel();
    await buildPdfPagePlaceholders();
    els.pdfContainer.scrollTop = 0;
    scheduleVisibleUpdate();
    renderSidebar();
  }

  async function changePdfZoom(factor, anchorPageNum) {
    if (!pdfViewer.doc || !pdfViewer.scale) {
      return;
    }
    pdfViewer.fitWidth = false;
    const newScale = Math.min(Math.max(pdfViewer.scale * factor, 0.2), 5);
    const anchor = typeof anchorPageNum === 'number'
      ? anchorPageNum
      : (Array.from(pdfViewer.visiblePages).sort((a, b) => a - b)[0] || 1);
    const anchorDiv = els.pdfView.querySelector(`[data-page-num="${anchor}"]`);
    let anchorRatio = 0;
    if (anchorDiv) {
      const containerRect = els.pdfContainer.getBoundingClientRect();
      const anchorRect = anchorDiv.getBoundingClientRect();
      anchorRatio = (containerRect.top - anchorRect.top) / Math.max(anchorRect.height, 1);
    }
    const newFitWidthScale = getFitWidthScale();
    if (newFitWidthScale !== null && Math.abs(newScale - newFitWidthScale) < 0.005) {
      pdfViewer.fitWidth = true;
    }
    pdfViewer.scale = newScale;
    updateZoomLabel();
    await rebuildPagesAtScale(anchor, anchorRatio);
  }

  function fitWidthZoom() {
    if (!pdfViewer.doc) {
      return;
    }
    const anchor = Array.from(pdfViewer.visiblePages).sort((a, b) => a - b)[0] || 1;
    let anchorRatio = 0;
    const anchorDiv = els.pdfView.querySelector(`[data-page-num="${anchor}"]`);
    if (anchorDiv) {
      const containerRect = els.pdfContainer.getBoundingClientRect();
      const anchorRect = anchorDiv.getBoundingClientRect();
      anchorRatio = (containerRect.top - anchorRect.top) / Math.max(anchorRect.height, 1);
    }
    pdfViewer.fitWidth = true;
    computeFitWidthScale();
    updateZoomLabel();
    rebuildPagesAtScale(anchor, anchorRatio);
  }

  async function rebuildPagesAtScale(anchorPageNum, anchorRatio) {
    await buildPdfPagePlaceholders();
    pdfViewer.renderedPages = new Set();
    refreshPdfSearchHighlights();
    const anchorDiv = els.pdfView.querySelector(`[data-page-num="${anchorPageNum}"]`);
    if (anchorDiv) {
      const containerRect = els.pdfContainer.getBoundingClientRect();
      const anchorRect = anchorDiv.getBoundingClientRect();
      els.pdfContainer.scrollTop += anchorRect.top - containerRect.top + anchorRatio * anchorRect.height * -1;
    }
    scheduleVisibleUpdate();
  }

  els.pdfContainer.addEventListener('scroll', scheduleVisibleUpdate);
  window.addEventListener('resize', () => {
    if (pdfViewer.doc && pdfViewer.fitWidth) {
      fitWidthZoom();
    }
  });
  els.pdfContainer.addEventListener('wheel', (event) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    if (!pdfViewer.doc || !pdfViewer.scale) {
      return;
    }
    event.preventDefault();
    const now = Date.now();
    if (now - pdfViewer.lastWheelZoomAt < 120) {
      return;
    }
    pdfViewer.lastWheelZoomAt = now;
    const factor = event.deltaY < 0 ? 1.1 : 0.9;
    const anchorPageNum = Array.from(pdfViewer.visiblePages).sort((a, b) => a - b)[0] || 1;
    changePdfZoom(factor, anchorPageNum);
  }, { passive: false });
  els.pdfZoomInBtn.addEventListener('click', () => changePdfZoom(1.25));
  els.pdfZoomOutBtn.addEventListener('click', () => changePdfZoom(0.8));
  els.pdfFitWidthBtn.addEventListener('click', fitWidthZoom);
  els.pdfPrevBtn.addEventListener('click', () => {
    const visible = Array.from(pdfViewer.visiblePages).sort((a, b) => a - b);
    const current = visible.length ? visible[0] : 1;
    goToPdfPage(Math.max(1, current - 1));
  });
  els.pdfNextBtn.addEventListener('click', () => {
    const visible = Array.from(pdfViewer.visiblePages).sort((a, b) => a - b);
    const current = visible.length ? visible[visible.length - 1] : 1;
    goToPdfPage(Math.min(pdfViewer.pageCount, current + 1));
  });

  /* ---------- Notions : répertoire + onglets ---------- */

  function findNotionsById(id) {
    return state.notions.filter((n) => n.id === id);
  }

  function getNotionCoursesById(id) {
    const courses = [];
    for (const n of findNotionsById(id)) {
      if (!courses.includes(n.course)) {
        courses.push(n.course);
      }
    }
    return courses;
  }

  function cachedLatexRender(key, render) {
    if (latexRenderCache.has(key)) {
      return latexRenderCache.get(key);
    }
    const value = render();
    latexRenderCache.set(key, value);
    return value;
  }

  function openNotion(notion) {
    if (state.section !== 'notions') {
      switchSection('notions');
    }
    const existing = state.openNotions.find((n) => n.id === notion.id);
    if (!existing) {
      state.openNotions.push(notion);
    }
    state.activeNotionId = notion.id;
    renderNotionTabs();
    renderNotionViews();
    updateNotionCardStates();
  }

  function closeNotion(id, event) {
    if (event) {
      event.stopPropagation();
    }
    const idx = state.openNotions.findIndex((n) => n.id === id);
    if (idx === -1) {
      return;
    }
    state.openNotions.splice(idx, 1);
    if (state.activeNotionId === id) {
      state.activeNotionId = state.openNotions.length > 0
        ? (state.openNotions[Math.min(idx, state.openNotions.length - 1)] || {}).id
        : null;
    }
    renderNotionTabs();
    renderNotionViews();
    updateNotionCardStates();
  }

  function closeAllNotions(event) {
    if (event) {
      event.stopPropagation();
    }
    if (state.openNotions.length === 0) {
      return;
    }
    state.openNotions = [];
    state.activeNotionId = null;
    renderNotionTabs();
    renderNotionViews();
    updateNotionCardStates();
  }

  function renderNotionTabs() {
    clearElement(els.notionTabs);
    show(els.notionTabs, state.openNotions.length > 0);
    if (state.openNotions.length === 0) {
      return;
    }
    for (const notion of state.openNotions) {
      const tab = document.createElement('div');
      tab.className = 'notion-tab' + (state.activeNotionId === notion.id ? ' active' : '');
      const env = document.createElement('span');
      env.className = 'notion-tab-env';
      env.textContent = notion.environmentDisplay || notion.environment;
      env.style.color = notionEnvColor(notion);
      tab.appendChild(env);
      const label = document.createElement('span');
      label.className = 'notion-tab-label';
      label.textContent = notion.title;
      label.title = `${notion.environmentDisplay || notion.environment} — ${notion.title} (${notion.course})`;
      tab.appendChild(label);
      const courses = getNotionCoursesById(notion.id);
      if (courses.length > 0) {
        const course = document.createElement('span');
        course.className = 'notion-tab-course';
        course.textContent = courses.map(courseNameToTitle).join(' · ');
        tab.appendChild(course);
      }
      const close = document.createElement('button');
      close.className = 'notion-tab-close';
      close.textContent = '×';
      close.title = 'Fermer';
      close.addEventListener('click', (e) => closeNotion(notion.id, e));
      tab.appendChild(close);
      tab.addEventListener('click', () => {
        state.activeNotionId = notion.id;
        renderNotionTabs();
        renderNotionViews();
      });
      els.notionTabs.appendChild(tab);
    }
    const closeAll = document.createElement('button');
    closeAll.className = 'notion-tab-close-all';
    closeAll.type = 'button';
    closeAll.textContent = '\u2715';
    closeAll.title = 'Fermer tous les onglets';
    closeAll.addEventListener('click', closeAllNotions);
    els.notionTabs.appendChild(closeAll);
  }

  function buildNotionActions(notion, card) {
    const actions = document.createElement('div');
    actions.className = 'notion-actions';

    const sourceToggle = document.createElement('button');
    sourceToggle.textContent = 'Code source';
    sourceToggle.addEventListener('click', () => {
      card.classList.toggle('notions-showing-source');
      sourceToggle.textContent = card.classList.contains('notions-showing-source')
        ? 'Masquer le code'
        : 'Code source';
    });
    actions.appendChild(sourceToggle);

    return actions;
  }

  function buildNotionSourceCode(notion) {
    const wrap = document.createElement('div');
    wrap.className = 'notion-source-wrap';

    const header = document.createElement('div');
    header.className = 'notion-source-header';
    const label = document.createElement('span');
    label.className = 'notion-source-label';
    label.textContent = 'Code LaTeX';
    header.appendChild(label);

    const copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'notion-source-copy';
    copyBtn.textContent = 'Copier';
    copyBtn.title = 'Copier le code LaTeX';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(notionToLatex(notion));
        copyBtn.textContent = '✓ Copié';
        copyBtn.classList.add('copied');
        setTimeout(() => {
          copyBtn.textContent = 'Copier';
          copyBtn.classList.remove('copied');
        }, 1500);
      } catch (err) {
        copyBtn.textContent = 'Échec';
        setTimeout(() => {
          copyBtn.textContent = 'Copier';
        }, 1500);
      }
    });
    header.appendChild(copyBtn);
    wrap.appendChild(header);

    const sourceCode = document.createElement('pre');
    sourceCode.className = 'notion-source-code';
    sourceCode.textContent = notionToLatex(notion);
    wrap.appendChild(sourceCode);

    return wrap;
  }

  function buildNotionViewCard(notion) {
    const macros = getSettingsMacros();
    const card = document.createElement('div');
    card.className = 'notion';

    const header = document.createElement('div');
    header.className = 'notion-header';
    const env = document.createElement('span');
    env.className = 'notion-env';
    env.textContent = notion.environmentDisplay || notion.environment;
    const title = document.createElement('span');
    title.className = 'notion-title';
    const fallbackTitle = notion.title && notion.title !== notion.environment
      ? notion.title
      : (notion.environmentDisplay || notion.environment).toLowerCase();
    title.innerHTML = cachedLatexRender(`${notion.id}::title`, () => renderLatexText(fallbackTitle, macros));
    const source = document.createElement('span');
    source.className = 'notion-source';
    source.textContent = notion.course || '';
    header.appendChild(env);
    header.appendChild(title);
    header.appendChild(source);
    card.appendChild(header);

    const body = renderLatexBody(notion.body, macros);
    card.appendChild(body);

    card.appendChild(buildNotionActions(notion, card));

    card.appendChild(buildNotionSourceCode(notion));

    for (const proof of notion.proofs || []) {
      card.appendChild(buildProofSection(proof));
    }

    return card;
  }

  function buildProofSection(proof) {
    const macros = getSettingsMacros();
    const section = document.createElement('details');
    section.className = 'notion-proof';
    const summary = document.createElement('summary');
    summary.className = 'notion-proof-header';
    const label = document.createElement('span');
    label.className = 'notion-proof-label';
    label.textContent = 'Démonstration';
    summary.appendChild(label);
    if (proof.hasTitle && proof.title) {
      const proofTitle = document.createElement('span');
      proofTitle.className = 'notion-proof-title';
      proofTitle.textContent = proof.title;
      summary.appendChild(proofTitle);
    }
    section.appendChild(summary);
    const body = renderLatexBody(proof.body, macros);
    body.classList.add('notion-proof-body');
    section.appendChild(body);
    return section;
  }

  function renderNotionViews() {
    els.notionViews.querySelectorAll('.notion-view').forEach((v) => v.remove());
    const hasOpen = state.openNotions.length > 0;
    show(els.notionsEmptyOpen, !hasOpen);
    if (!hasOpen) {
      return;
    }
    const frag = document.createDocumentFragment();
    for (const notion of state.openNotions) {
      let view = notionViewCache.get(notion.id);
      if (!view) {
        view = document.createElement('div');
        view.className = 'notion-view';
        view.dataset.notionId = notion.id;
        const grouped = findNotionsById(notion.id);
        for (const entry of grouped) {
          view.appendChild(buildNotionViewCard(entry));
        }
        notionViewCache.set(notion.id, view);
      }
      view.classList.toggle('active', state.activeNotionId === notion.id);
      frag.appendChild(view);
    }
    els.notionViews.appendChild(frag);
  }

  /* ---------- Events ---------- */

  els.openFolderBtn.addEventListener('click', openFolderDialog);
  els.rescanBtn.addEventListener('click', () => rescan({ preserve: true }));

  let autoRescanTimer = null;
  let lastAutoRescanAt = 0;
  let pendingPdfReload = false;
  window.api.onFolderChanged((changedPaths) => {
    if (state.activePdf && changedPaths.some((p) => p === state.activePdf)) {
      pendingPdfReload = true;
    }
    if (autoRescanTimer) {
      clearTimeout(autoRescanTimer);
    }
    const wait = Math.max(0, 1500 - (Date.now() - lastAutoRescanAt));
    autoRescanTimer = setTimeout(async () => {
      autoRescanTimer = null;
      lastAutoRescanAt = Date.now();
      const reloadPdf = pendingPdfReload;
      pendingPdfReload = false;
      await rescan({ preserve: true, reloadPdf });
    }, wait + 400);
  });
  for (const btn of els.activityIcons) {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  }

  let searchTimer = null;
  els.notionsSearch.addEventListener('input', () => {
    state.notionFilter = els.notionsSearch.value.trim();
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    searchTimer = setTimeout(() => {
      resetNotionsGridPagination();
      renderNotionsGrid();
    }, 120);
  });

  if (els.notionGridMore) {
    els.notionGridMore.addEventListener('click', showMoreNotions);
  }

  /* ---------- Splitter vertical : réglage du bloc de recherche ---------- */

  function setNotionsTopHeight(height) {
    const readerRect = els.readerNotions.getBoundingClientRect();
    const toolbar = els.readerNotions.querySelector('#notions-toolbar');
    const toolbarHeight = toolbar ? toolbar.getBoundingClientRect().height : 36;
    const available = readerRect.height - toolbarHeight - 6 - 80;
    const clamped = Math.min(Math.max(height, 60), Math.max(available, 60));
    els.notionsTop.style.height = `${clamped}px`;
  }

  if (els.notionsSplitter && els.notionsTop) {
    let dragging = false;
    let startY = 0;
    let startHeight = 0;

    els.notionsSplitter.addEventListener('mousedown', (event) => {
      dragging = true;
      startY = event.clientY;
      startHeight = els.notionsTop.getBoundingClientRect().height;
      els.notionsSplitter.classList.add('dragging');
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      event.preventDefault();
    });

    window.addEventListener('mousemove', (event) => {
      if (!dragging) {
        return;
      }
      setNotionsTopHeight(startHeight + (event.clientY - startY));
    });

    window.addEventListener('mouseup', () => {
      if (!dragging) {
        return;
      }
      dragging = false;
      els.notionsSplitter.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });

    els.notionsSplitter.addEventListener('dblclick', () => {
      els.notionsTop.style.height = '';
    });

    window.addEventListener('resize', () => {
      if (els.notionsTop.style.height) {
        setNotionsTopHeight(parseFloat(els.notionsTop.style.height));
      }
    });
  }

  /* ---------- Init ---------- */

  async function init() {
    const stateResult = await window.api.getState();
    if (stateResult.folder) {
      els.folderDisplay.textContent = stateResult.folder;
      els.folderDisplay.title = stateResult.folder;
      await rescan();
    } else {
      renderSidebar();
    }
  }

  initUpdateBanner();
  init();
})();
