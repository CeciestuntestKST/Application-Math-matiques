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
    notionsSplitter: document.getElementById('notions-splitter'),
    leconsList: document.getElementById('lecons-list'),
    oralList: document.getElementById('oral-list'),
    readerOral: document.getElementById('reader-oral'),
    oralHome: document.getElementById('oral-home'),
    oralCards: document.getElementById('oral-cards'),
    oralEmptyHint: document.getElementById('oral-empty-hint'),
    oralCount: document.getElementById('oral-count'),
    oralCreateBtn: document.getElementById('oral-create'),
    oralCreateForm: document.getElementById('oral-create-form'),
    oralCreateNumber: document.getElementById('oral-create-number'),
    oralCreateTitle: document.getElementById('oral-create-title'),
    oralCreateConfirm: document.getElementById('oral-create-confirm'),
    oralCreateCancel: document.getElementById('oral-create-cancel'),
    oralDetail: document.getElementById('oral-detail'),
    oralBack: document.getElementById('oral-back'),
    oralNumberLabel: document.getElementById('oral-number-label'),
    oralTitleLabel: document.getElementById('oral-title-label'),
    oralSaveStatus: document.getElementById('oral-save-status'),
    oralSearch: document.getElementById('oral-search'),
    leconsSearch: document.getElementById('lecons-search'),
    devsSearch: document.getElementById('devs-search'),
    oralPlansList: document.getElementById('oral-plans-list'),
    oralDevsList: document.getElementById('oral-devs-list'),
    oralPlanPreviewPane: document.getElementById('oral-plan-preview-pane'),
    oralPlanPreviewTitle: document.getElementById('oral-plan-preview-title'),
    oralPlanToc: document.getElementById('oral-plan-toc'),
    oralPlanRenderView: document.getElementById('oral-plan-render-view'),
    oralDevPreviewPane: document.getElementById('oral-dev-preview-pane'),
    oralDevPreviewTitle: document.getElementById('oral-dev-preview-title'),
    oralDevToc: document.getElementById('oral-dev-toc'),
    oralDevRenderView: document.getElementById('oral-dev-render-view'),
    oralDevBackBtn: document.getElementById('oral-dev-back'),
    oralDevOpenEditorBtn: document.getElementById('oral-dev-open-editor'),
    oralPlanBackBtn: document.getElementById('oral-plan-back'),
    oralPlanOpenEditorBtn: document.getElementById('oral-plan-open-editor'),
    readerLecons: document.getElementById('reader-lecons'),
    leconsHome: document.getElementById('lecons-home'),
    leconsCards: document.getElementById('lecons-cards'),
    leconsEmptyHint: document.getElementById('lecons-empty-hint'),
    lessonCreateBtn: document.getElementById('lesson-create'),
    lessonCreateForm: document.getElementById('lecons-create-form'),
    lessonCreateNumber: document.getElementById('lesson-create-number'),
    lessonCreateTitle: document.getElementById('lesson-create-title'),
    lessonCreateConfirm: document.getElementById('lesson-create-confirm'),
    lessonCreateCancel: document.getElementById('lesson-create-cancel'),
    lessonEdit: document.getElementById('lesson-edit'),
    lessonBack: document.getElementById('lesson-back'),
    lessonNumberLabel: document.getElementById('lesson-number-label'),
    lessonTitleInput: document.getElementById('lesson-title-input'),
    lessonSaveStatus: document.getElementById('lesson-save-status'),
    lessonDeleteBtn: document.getElementById('lesson-delete'),
    lessonTexInput: document.getElementById('lesson-tex-input'),
    lessonRenderView: document.getElementById('lesson-render-view'),
    lessonViewCodeBtn: document.getElementById('lesson-view-code'),
    lessonImportSearch: document.getElementById('lesson-import-search'),
    lessonImportList: document.getElementById('lesson-import-list'),
    devsList: document.getElementById('devs-list'),
    readerDevs: document.getElementById('reader-devs'),
    devsHome: document.getElementById('devs-home'),
    devsCards: document.getElementById('devs-cards'),
    devsEmptyHint: document.getElementById('devs-empty-hint'),
    devCreateBtn: document.getElementById('dev-create'),
    devCreateForm: document.getElementById('devs-create-form'),
    devCreateTitle: document.getElementById('dev-create-title'),
    devCreateConfirm: document.getElementById('dev-create-confirm'),
    devCreateCancel: document.getElementById('dev-create-cancel'),
    devEdit: document.getElementById('dev-edit'),
    devBack: document.getElementById('dev-back'),
    devTitleInput: document.getElementById('dev-title-input'),
    devSaveStatus: document.getElementById('dev-save-status'),
    devDeleteBtn: document.getElementById('dev-delete'),
    devTexInput: document.getElementById('dev-tex-input'),
    devRenderView: document.getElementById('dev-render-view'),
    devViewCodeBtn: document.getElementById('dev-view-code'),
    devLessonsNumbers: document.getElementById('dev-lessons-numbers'),
    devLessonsList: document.getElementById('dev-lessons-list'),
    devImportSearch: document.getElementById('dev-import-search'),
    devImportList: document.getElementById('dev-import-list')
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
    notionsListRendered: 0,
    lessons: [],
    activeLessonId: null,
    lessonShowCode: false,
    oralLessons: [],
    activeOralNumber: null,
    activeOralPlanId: null,
    activeOralDevId: null,
    devs: [],
    activeDevId: null,
    devShowCode: false
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

  const dialogEls = {
    root: document.getElementById('app-dialog'),
    box: document.getElementById('app-dialog-box'),
    title: document.getElementById('app-dialog-title'),
    message: document.getElementById('app-dialog-message'),
    input: document.getElementById('app-dialog-input'),
    okBtn: document.getElementById('app-dialog-ok'),
    cancelBtn: document.getElementById('app-dialog-cancel')
  };

  function showAppDialog(options) {
    return new Promise((resolve) => {
      if (!dialogEls.root || !dialogEls.box || !dialogEls.title || !dialogEls.message || !dialogEls.input || !dialogEls.okBtn || !dialogEls.cancelBtn) {
        resolve(null);
        return;
      }
      const done = (value) => {
        dialogEls.okBtn.removeEventListener('click', onOk);
        dialogEls.cancelBtn.removeEventListener('click', onCancel);
        dialogEls.input.removeEventListener('keydown', onInputKey);
        dialogEls.box.removeEventListener('keydown', onBoxKey);
        dialogEls.root.classList.add('hidden');
        resolve(value);
      };
      const onOk = () => {
        if (options.mode === 'prompt') {
          done(dialogEls.input.value);
        } else {
          done(true);
        }
      };
      const onCancel = () => done(options.mode === 'prompt' ? null : false);
      const onInputKey = (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onOk();
        }
      };
      const onBoxKey = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onCancel();
        }
      };
      dialogEls.title.textContent = options.title || '';
      dialogEls.message.textContent = options.message || '';
      dialogEls.message.classList.toggle('hidden', !options.message);
      if (options.mode === 'prompt') {
        dialogEls.input.value = options.value || '';
        dialogEls.input.classList.remove('hidden');
      } else {
        dialogEls.input.classList.add('hidden');
      }
      dialogEls.okBtn.textContent = options.okLabel || 'OK';
      dialogEls.cancelBtn.textContent = options.cancelLabel || 'Annuler';
      dialogEls.okBtn.addEventListener('click', onOk);
      dialogEls.cancelBtn.addEventListener('click', onCancel);
      dialogEls.input.addEventListener('keydown', onInputKey);
      dialogEls.box.addEventListener('keydown', onBoxKey);
      dialogEls.root.classList.remove('hidden');
      if (options.mode === 'prompt') {
        dialogEls.input.focus();
        dialogEls.input.select();
      } else {
        dialogEls.okBtn.focus();
      }
    });
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

  function notionQueryRank(notion, q) {
    if (fold(notion.title).includes(q)) {
      return 0;
    }
    if (fold(notion.environmentDisplay).includes(q)) {
      return 1;
    }
    if (fold(notion.course).includes(q)) {
      return 2;
    }
    if (fold(notion.body).includes(q)) {
      return 3;
    }
    if (Array.isArray(notion.proofs)) {
      for (const proof of notion.proofs) {
        if (fold(proof.body).includes(q)) {
          return 3;
        }
      }
    }
    return -1;
  }

  function getFilteredNotions() {
    const q = fold(state.notionFilter);
    const titleFilter = state.notionTitleFilter;
    const excluded = state.notionCourseExcluded;
    const matched = state.notions.filter((notion) => {
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
      return notionQueryRank(notion, q) >= 0;
    });
    if (q) {
      matched.sort((a, b) => notionQueryRank(a, q) - notionQueryRank(b, q));
    }
    return matched;
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
    const q = fold(state.notionFilter);
    if (q && fold(notion.title).includes(q)) {
      card.classList.add('title-match');
    }
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
    show(els.leconsList, section === 'lecons');
    show(els.oralList, section === 'oral');
    show(els.devsList, section === 'developpements');
    if (section === 'oral') {
      state.activeOralNumber = null;
      state.activeOralPlanId = null;
      state.activeOralDevId = null;
      hideCreateOralForm();
      refreshOralData();
    }
    if (section === 'lecons') {
      state.activeLessonId = null;
      state.lessonShowCode = false;
      hideCreateLessonForm();
      renderLeconsSidebar();
      updateLeconsView();
    }
    if (section === 'developpements') {
      state.activeDevId = null;
      state.devShowCode = false;
      hideCreateDevForm();
      renderDevsSidebar();
      updateDevsView();
    }
    updateMainView();
  }

  async function refreshOralData() {
    await Promise.all([loadLessons(), loadDevs(), loadOralLessons()]);
    renderOralSidebar();
    updateOralView();
  }

  function updateMainView() {
    if (!state.scan) {
      const showSectionView = state.section === 'lecons' || state.section === 'oral' || state.section === 'developpements';
      show(els.emptyState, !showSectionView);
      show(els.readerCours, false);
      show(els.readerNotions, false);
      show(els.readerLecons, state.section === 'lecons');
      show(els.readerOral, state.section === 'oral');
      show(els.readerDevs, state.section === 'developpements');
      return;
    }
    show(els.emptyState, false);
    show(els.readerCours, state.section === 'cours');
    show(els.readerNotions, state.section === 'notions');
    show(els.readerLecons, state.section === 'lecons');
    show(els.readerOral, state.section === 'oral');
    show(els.readerDevs, state.section === 'developpements');
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
    loadLessons().then(() => {
      renderLeconsSidebar();
      if (state.section === 'lecons') {
        updateLeconsView();
      }
    });
    loadDevs().then(() => {
      renderDevsSidebar();
      if (state.section === 'developpements') {
        updateDevsView();
      }
    });
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

  /* ---------- Leçons d'oral ---------- */

  let lessonSaveTimer = null;
  let lessonSaveSeq = 0;

  function getActiveLesson() {
    return state.lessons.find((l) => l.id === state.activeLessonId) || null;
  }

  async function loadLessons() {
    if (!window.api.listLessons) {
      return;
    }
    const result = await window.api.listLessons();
    state.lessons = Array.isArray(result && result.lessons) ? result.lessons : [];
  }

  async function saveActiveLesson() {
    const lesson = getActiveLesson();
    if (!lesson) {
      return;
    }
    const seq = ++lessonSaveSeq;
    if (els.lessonSaveStatus) {
      els.lessonSaveStatus.textContent = 'Sauvegarde…';
    }
    const result = await window.api.saveLesson({
      path: lesson.path || null,
      fileName: lesson.fileName || null,
      number: lesson.number || null,
      title: lesson.title || '',
      content: lesson.content || ''
    });
    if (seq !== lessonSaveSeq) {
      return;
    }
    if (result && result.lesson && !result.error) {
      const idx = state.lessons.findIndex((l) => l.id === lesson.id);
      if (idx !== -1) {
        state.lessons[idx] = result.lesson;
      }
      if (els.lessonSaveStatus) {
        els.lessonSaveStatus.textContent = `Sauvegardé — ${result.lesson.fileName}`;
      }
    } else if (els.lessonSaveStatus) {
      els.lessonSaveStatus.textContent = `Erreur : ${(result && result.error) || 'sauvegarde impossible'}`;
    }
  }

  function scheduleLessonSave() {
    if (lessonSaveTimer) {
      clearTimeout(lessonSaveTimer);
    }
    lessonSaveTimer = setTimeout(() => {
      lessonSaveTimer = null;
      saveActiveLesson();
    }, 600);
  }

  /* ---------- Section Oral ---------- */

  async function loadOralLessons() {
    if (!window.api.listOralLessons) {
      state.oralLessons = [];
      return;
    }
    const result = await window.api.listOralLessons();
    state.oralLessons = Array.isArray(result && result.lessons) ? result.lessons : [];
  }

  function getActiveOralLesson() {
    return state.oralLessons.find((l) => l.number === state.activeOralNumber) || null;
  }

  function getOralNumberSet() {
    const numbers = new Set();
    for (const lesson of state.oralLessons) {
      if (typeof lesson.number === 'number') {
        numbers.add(lesson.number);
      }
    }
    for (const lesson of state.lessons) {
      if (typeof lesson.number === 'number') {
        numbers.add(lesson.number);
      }
    }
    for (const dev of state.devs) {
      for (const num of Array.isArray(dev.lessonNumbers) ? dev.lessonNumbers : []) {
        numbers.add(num);
      }
    }
    return numbers;
  }

  function countPlansForNumber(number) {
    return state.lessons.filter((l) => l.number === number).length;
  }

  function getDevsForNumber(number) {
    return state.devs.filter((dev) => {
      const numbers = new Set(Array.isArray(dev.lessonNumbers) ? dev.lessonNumbers : []);
      if (Array.isArray(dev.lessonIds)) {
        for (const id of dev.lessonIds) {
          const lesson = state.lessons.find((l) => l.id === id);
          if (lesson && lesson.number) {
            numbers.add(lesson.number);
          }
        }
      }
      return numbers.has(number);
    });
  }

  function renderOralSidebar() {
    if (!els.oralList) {
      return;
    }
    clearElement(els.oralList);
    const numbers = Array.from(getOralNumberSet()).sort((a, b) => a - b);
    if (numbers.length === 0) {
      els.oralList.appendChild(buildEmptyItem('Aucun numéro de leçon'));
      return;
    }
    const oralSidebarQuery = getOralSearchQuery();
    const filteredNumbers = oralSidebarQuery === null
      ? numbers
      : numbers.filter((number) => matchesOralSearch(number, oralSidebarQuery));
    if (filteredNumbers.length === 0) {
      els.oralList.appendChild(buildEmptyItem('Aucun numéro trouvé'));
      return;
    }
    els.oralList.appendChild(buildGroupHeader('Numéros de leçons', filteredNumbers.length));
    for (const number of filteredNumbers) {
      const registered = state.oralLessons.find((l) => l.number === number);
      els.oralList.appendChild(
        buildListItem({
          icon: '\u2116',
          label: `${number}. ${registered ? registered.title : 'Sans titre'}`,
          title: registered ? registered.title : `Num\u00e9ro ${number}`,
          active: state.activeOralNumber === number,
          onClick: () => {
            state.activeOralNumber = number;
            state.activeOralPlanId = null;
            state.activeOralDevId = null;
            renderOralSidebar();
            updateOralView();
          }
        })
      );
    }
  }

  function renderOralCards() {
    if (!els.oralCards) {
      return;
    }
    clearElement(els.oralCards);
    const oralCardsQuery = getOralSearchQuery();
    const numbers = Array.from(getOralNumberSet()).sort((a, b) => a - b)
      .filter((number) => matchesOralSearch(number, oralCardsQuery));
    show(els.oralEmptyHint, numbers.length === 0 && oralCardsQuery === null);
    if (els.oralCount) {
      const shown = numbers.length;
      els.oralCount.textContent = shown > 0 ? `${shown} num\u00e9ro${shown > 1 ? 's' : ''}` : '';
    }
    for (const number of numbers) {
      const registered = state.oralLessons.find((l) => l.number === number);
      const plans = countPlansForNumber(number);
      const devs = getDevsForNumber(number);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'lesson-card oral-card';
      card.title = registered ? registered.title : `Num\u00e9ro ${number}`;
      const numberEl = document.createElement('span');
      numberEl.className = 'lesson-card-number';
      numberEl.textContent = String(number);
      card.appendChild(numberEl);
      const title = document.createElement('span');
      title.className = 'lesson-card-title';
      title.textContent = registered ? registered.title : 'Sans titre';
      card.appendChild(title);
      const hint = document.createElement('span');
      hint.className = 'lesson-card-hint';
      hint.textContent = `${plans} plan${plans > 1 ? 's' : ''} · ${devs.length} d\u00e9v.${devs.length > 1 ? 's' : ''}`;
      card.appendChild(hint);
      card.addEventListener('click', () => {
        state.activeOralNumber = number;
        state.activeOralPlanId = null;
        state.activeOralDevId = null;
        renderOralSidebar();
        updateOralView();
      });
      const menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.className = 'oral-card-menu-btn';
      menuBtn.textContent = '\u22ef';
      menuBtn.title = 'Renommer ou retirer cette le\u00e7on';
      menuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        openOralCardMenu(menuBtn, number);
      });
      card.appendChild(menuBtn);
      els.oralCards.appendChild(card);
    }
  }

  function getOralSearchQuery() {
    const value = els.oralSearch ? (els.oralSearch.value || '').trim() : '';
    return value ? fold(value) : null;
  }

  function matchesOralSearch(number, query) {
    if (query === null || query === undefined) {
      return true;
    }
    if (fold(String(number)).includes(query)) {
      return true;
    }
    const registered = state.oralLessons.find((l) => l.number === number);
    return !!registered && fold(registered.title || '').includes(query);
  }

  function closeOralCardMenu() {
    const existing = document.querySelector('.card-menu');
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    document.removeEventListener('click', closeOralCardMenu);
  }

  function openOralCardMenu(anchor, number) {
    closeOralCardMenu();
    const menu = document.createElement('div');
    menu.className = 'card-menu';
    const renameItem = document.createElement('button');
    renameItem.type = 'button';
    renameItem.className = 'card-menu-item';
    renameItem.textContent = 'Renommer';
    renameItem.addEventListener('click', (event) => {
      event.stopPropagation();
      closeOralCardMenu();
      renameOralLesson(number);
    });
    menu.appendChild(renameItem);
    const removeItem = document.createElement('button');
    removeItem.type = 'button';
    removeItem.className = 'card-menu-item';
    removeItem.textContent = 'Retirer';
    removeItem.addEventListener('click', (event) => {
      event.stopPropagation();
      closeOralCardMenu();
      removeOralLesson(number);
    });
    menu.appendChild(removeItem);
    anchor.parentNode.appendChild(menu);
    setTimeout(() => {
      document.addEventListener('click', closeOralCardMenu);
    }, 0);
  }

  function updateOralView() {
    const hasDetail = state.activeOralNumber !== null;
    show(els.oralHome, !hasDetail);
    show(els.oralDetail, hasDetail);
    if (hasDetail) {
      renderOralDetail();
    } else {
      renderOralCards();
    }
  }

  function renderOralDetail() {
    const number = state.activeOralNumber;
    const registered = getActiveOralLesson();
    if (els.oralNumberLabel) {
      els.oralNumberLabel.textContent = `Le\u00e7on ${number}`;
    }
    if (els.oralTitleLabel) {
      els.oralTitleLabel.textContent = registered ? registered.title : 'Non d\u00e9clar\u00e9e';
    }
    renderOralPlansList();
    renderOralDevsList();
    updateOralPlanPreviewVisibility();
    updateOralDevPreviewVisibility();
    if (state.activeOralPlanId) {
      renderOralPlanPreview();
    }
    if (state.activeOralDevId) {
      renderOralDevPreview();
    }
  }

  function renderOralPlansList() {
    if (!els.oralPlansList) {
      return;
    }
    clearElement(els.oralPlansList);
    const plans = state.lessons.filter((l) => l.number === state.activeOralNumber);
    plans.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr'));
    if (plans.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = 'Aucun plan pour ce num\u00e9ro — \u00ab + Plan \u00bb pour en r\u00e9diger un.';
      els.oralPlansList.appendChild(empty);
      return;
    }
    for (const plan of plans) {
      const wrapper = document.createElement('div');
      wrapper.className = 'oral-plan-entry';
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'oral-plan-item';
      item.title = plan.path || plan.title;
      const label = document.createElement('span');
      label.className = 'oral-plan-title';
      label.textContent = plan.title || plan.fileName;
      item.appendChild(label);
      const hint = document.createElement('span');
      hint.className = 'oral-plan-hint';
      hint.textContent = plan.updatedAt
        ? `modifi\u00e9 le ${new Date(plan.updatedAt).toLocaleDateString('fr-FR')}`
        : '';
      item.appendChild(hint);
      item.addEventListener('click', () => {
        state.activeOralPlanId = plan.id;
        updateOralPlanPreviewVisibility();
        renderOralPlanPreview();
      });
      wrapper.appendChild(item);
      const toc = document.createElement('div');
      toc.className = 'oral-plan-toc';
      wrapper.appendChild(toc);
      els.oralPlansList.appendChild(wrapper);
      fillOralPlanToc(toc, plan);
    }
  }

  async function fillOralPlanToc(tocElement, plan) {
    if (!tocElement || !plan || !plan.content || !window.api.parseDevContent) {
      return;
    }
    const number = state.activeOralNumber;
    const planId = plan.id;
    const result = await window.api.parseDevContent(plan.content);
    if (!tocElement.isConnected
      || state.section !== 'oral'
      || state.activeOralNumber !== number) {
      return;
    }
    const sections = (result && Array.isArray(result.sections)) ? result.sections : [];
    if (sections.length === 0) {
      return;
    }
    const frag = document.createDocumentFragment();
    for (const section of sections) {
      const line = document.createElement('div');
      line.className = 'oral-plan-toc-line';
      line.style.paddingLeft = `${(section.level || 0) * 12 + 6}px`;
      line.textContent = section.title;
      frag.appendChild(line);
    }
    tocElement.appendChild(frag);
  }

  let oralPlanRenderSeq = 0;

  function getActiveOralPlan() {
    if (state.activeOralNumber === null) {
      return null;
    }
    return state.lessons.find((l) => l.id === state.activeOralPlanId) || null;
  }

  function updateOralPlanPreviewVisibility() {
    const hasPlan = !!getActiveOralPlan();
    if (els.oralPlansList) {
      show(els.oralPlansList, !hasPlan);
    }
    if (els.oralPlanPreviewPane) {
      show(els.oralPlanPreviewPane, hasPlan);
    }
  }

  async function renderOralPlanPreview() {
    const plan = getActiveOralPlan();
    if (!plan || !els.oralPlanRenderView) {
      return;
    }
    const number = state.activeOralNumber;
    const planId = plan.id;
    if (els.oralPlanPreviewTitle) {
      els.oralPlanPreviewTitle.textContent = plan.title || plan.fileName;
    }
    clearElement(els.oralPlanRenderView);
    if (els.oralPlanToc) {
      clearElement(els.oralPlanToc);
    }
    const seq = ++oralPlanRenderSeq;
    const result = plan.content
      ? await window.api.parseDevContent(plan.content)
      : { notions: [], sections: [] };
    if (seq !== oralPlanRenderSeq) {
      return;
    }
    if (state.section !== 'oral' || state.activeOralNumber !== number || state.activeOralPlanId !== planId) {
      return;
    }
    const sections = (result && Array.isArray(result.sections)) ? result.sections : [];
    if (els.oralPlanToc && sections.length > 0) {
      const tocTitle = document.createElement('div');
      tocTitle.className = 'oral-toc-title';
      tocTitle.textContent = 'Sommaire';
      els.oralPlanToc.appendChild(tocTitle);
      for (const section of sections) {
        const line = document.createElement('div');
        line.className = 'oral-toc-line';
        line.style.paddingLeft = `${(section.level || 0) * 14 + 8}px`;
        line.textContent = section.title;
        els.oralPlanToc.appendChild(line);
      }
    }
    const notions = (result && Array.isArray(result.notions)) ? result.notions : [];
    const outline = (result && Array.isArray(result.outline)) ? result.outline : null;
    if (outline && outline.length > 0) {
      els.oralPlanRenderView.appendChild(buildOutlineFragment(outline, getSettingsMacros(), { compactHeader: true }));
      return;
    }
    if (notions.length === 0 && sections.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.style.padding = '24px 16px';
      empty.textContent = plan.content
        ? 'Aucun environnement reconnu dans ce plan.'
        : 'Plan vide — « Ouvrir dans Plans » pour commencer à le rédiger.';
      els.oralPlanRenderView.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    for (const notion of notions) {
      frag.appendChild(buildDevNotionBlock(notion, { compactHeader: true }));
    }
    els.oralPlanRenderView.appendChild(frag);
  }

  let oralDevRenderSeq = 0;

  function getActiveOralDev() {
    if (state.activeOralNumber === null) {
      return null;
    }
    return state.devs.find((d) => d.id === state.activeOralDevId) || null;
  }

  function updateOralDevPreviewVisibility() {
    const hasDev = !!getActiveOralDev();
    if (els.oralDevsList) {
      show(els.oralDevsList, !hasDev);
    }
    if (els.oralDevPreviewPane) {
      show(els.oralDevPreviewPane, hasDev);
    }
  }

  async function renderOralDevPreview() {
    const dev = getActiveOralDev();
    if (!dev || !els.oralDevRenderView) {
      return;
    }
    const number = state.activeOralNumber;
    const devId = dev.id;
    if (els.oralDevPreviewTitle) {
      els.oralDevPreviewTitle.textContent = dev.title || dev.fileName;
    }
    clearElement(els.oralDevRenderView);
    if (els.oralDevToc) {
      clearElement(els.oralDevToc);
    }
    const seq = ++oralDevRenderSeq;
    const result = dev.content
      ? await window.api.parseDevContent(dev.content)
      : { notions: [], sections: [] };
    if (seq !== oralDevRenderSeq) {
      return;
    }
    if (state.section !== 'oral' || state.activeOralNumber !== number || state.activeOralDevId !== devId) {
      return;
    }
    const sections = (result && Array.isArray(result.sections)) ? result.sections : [];
    if (els.oralDevToc && sections.length > 0) {
      const tocTitle = document.createElement('div');
      tocTitle.className = 'oral-toc-title';
      tocTitle.textContent = 'Sommaire';
      els.oralDevToc.appendChild(tocTitle);
      for (const section of sections) {
        const line = document.createElement('div');
        line.className = 'oral-toc-line';
        line.style.paddingLeft = `${(section.level || 0) * 14 + 8}px`;
        line.textContent = section.title;
        els.oralDevToc.appendChild(line);
      }
    }
    const notions = (result && Array.isArray(result.notions)) ? result.notions : [];
    const outline = (result && Array.isArray(result.outline)) ? result.outline : null;
    if (outline && outline.length > 0) {
      els.oralDevRenderView.appendChild(buildOutlineFragment(outline, getSettingsMacros(), { compactHeader: true }));
      return;
    }
    if (notions.length === 0 && sections.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.style.padding = '24px 16px';
      empty.textContent = dev.content
        ? 'Aucun environnement reconnu dans ce d\u00e9veloppement.'
        : 'D\u00e9veloppement vide \u2014 bouton crayon pour commencer \u00e0 le r\u00e9diger.';
      els.oralDevRenderView.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    for (const notion of notions) {
      frag.appendChild(buildDevNotionBlock(notion, { compactHeader: true }));
    }
    els.oralDevRenderView.appendChild(frag);
  }

  function openOralDevInDevs() {
    const dev = getActiveOralDev();
    if (!dev) {
      return;
    }
    switchSection('developpements');
    state.activeDevId = dev.id;
    state.devShowCode = false;
    renderDevsSidebar();
    updateDevsView();
  }

  function openOralPlanInLessons() {
    const plan = getActiveOralPlan();
    if (!plan) {
      return;
    }
    switchSection('lecons');
    state.activeLessonId = plan.id;
    state.lessonShowCode = false;
    renderLeconsSidebar();
    updateLeconsView();
  }

  function renderOralDevsList() {
    if (!els.oralDevsList) {
      return;
    }
    clearElement(els.oralDevsList);
    const devs = getDevsForNumber(state.activeOralNumber);
    if (devs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = 'Aucun d\u00e9veloppement associ\u00e9 \u00e0 ce num\u00e9ro.';
      els.oralDevsList.appendChild(empty);
      return;
    }
    for (const dev of devs) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'oral-plan-item';
      item.title = dev.path || dev.title;
      const label = document.createElement('span');
      label.className = 'oral-plan-title';
      label.textContent = dev.title || dev.fileName;
      item.appendChild(label);
      const hint = document.createElement('span');
      hint.className = 'oral-plan-hint';
      hint.textContent = dev.updatedAt
        ? `modifi\u00e9 le ${new Date(dev.updatedAt).toLocaleDateString('fr-FR')}`
        : '';
      item.appendChild(hint);
      item.addEventListener('click', () => {
        state.activeOralDevId = dev.id;
        updateOralDevPreviewVisibility();
        renderOralDevPreview();
      });
      els.oralDevsList.appendChild(item);
    }
  }

  function showCreateOralForm() {
    if (!state.scan) {
      return;
    }
    show(els.oralCreateForm, true);
    if (els.oralCreateNumber) {
      els.oralCreateNumber.value = '';
    }
    if (els.oralCreateTitle) {
      els.oralCreateTitle.value = '';
      els.oralCreateTitle.focus();
    }
  }

  function hideCreateOralForm() {
    show(els.oralCreateForm, false);
  }

  async function createOralLesson() {
    const numberStr = els.oralCreateNumber && els.oralCreateNumber.value
      ? els.oralCreateNumber.value.trim()
      : '';
    const number = numberStr ? parseInt(numberStr, 10) : null;
    const title = els.oralCreateTitle && els.oralCreateTitle.value
      ? els.oralCreateTitle.value.trim()
      : '';
    if (!number || Number.isNaN(number) || number <= 0) {
      if (els.oralSaveStatus) {
        els.oralSaveStatus.textContent = 'Num\u00e9ro requis';
      }
      return;
    }
    if (state.oralLessons.some((l) => l.number === number)) {
      if (els.oralSaveStatus) {
        els.oralSaveStatus.textContent = `Le num\u00e9ro ${number} est d\u00e9j\u00e0 d\u00e9clar\u00e9`;
      }
      return;
    }
    if (!title) {
      if (els.oralSaveStatus) {
        els.oralSaveStatus.textContent = 'Titre requis';
      }
      return;
    }
    const result = await window.api.saveOralLesson({ number, title });
    if (result && result.lesson && !result.error) {
      hideCreateOralForm();
      await loadOralLessons();
      state.activeOralNumber = result.lesson.number;
      state.activeOralPlanId = null;
      state.activeOralDevId = null;
      renderOralSidebar();
      updateOralView();
    } else if (els.oralSaveStatus) {
      els.oralSaveStatus.textContent = `Erreur : ${(result && result.error) || 'cr\u00e9ation impossible'}`;
    }
  }

  async function renameOralLesson(number) {
    const registered = state.oralLessons.find((l) => l.number === number) || null;
    const current = registered ? registered.title : '';
    const title = await showAppDialog({
      mode: 'prompt',
      title: `Renommer la le\u00e7on ${number}`,
      message: 'Titre officiel de la le\u00e7on :',
      value: current,
      okLabel: 'Enregistrer'
    });
    if (title === null) {
      return;
    }
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    const result = await window.api.saveOralLesson({ number, title: trimmed });
    if (result && result.lesson && !result.error) {
      await loadOralLessons();
      renderOralSidebar();
      renderOralCards();
      if (state.activeOralNumber === number) {
        renderOralDetail();
      }
    }
  }

  async function removeOralLesson(number) {
    const registered = state.oralLessons.find((l) => l.number === number) || null;
    const ok = await showAppDialog({
      mode: 'confirm',
      title: `Retirer la le\u00e7on ${number}${registered ? ` \u00ab ${registered.title} \u00bb` : ''} ?`,
      message: 'Les plans et d\u00e9veloppements ne seront pas supprim\u00e9s.',
      okLabel: 'Retirer'
    });
    if (!ok) {
      return;
    }
    const result = await window.api.deleteOralLesson(number);
    if (result && !result.error) {
      if (state.activeOralNumber === number) {
        state.activeOralNumber = null;
        state.activeOralPlanId = null;
        state.activeOralDevId = null;
      }
      await loadOralLessons();
      renderOralSidebar();
      updateOralView();
    }
  }

  function renderLeconsSidebar() {
    if (!els.leconsList) {
      return;
    }
    clearElement(els.leconsList);
    if (state.lessons.length === 0) {
      els.leconsList.appendChild(buildEmptyItem('Aucun plan'));
      return;
    }
    els.leconsList.appendChild(buildGroupHeader('Plans', state.lessons.length));
    for (const lesson of state.lessons) {
      els.leconsList.appendChild(
        buildListItem({
          icon: 'Σ',
          label: lesson.number ? `${lesson.number}. ${lesson.title}` : lesson.title,
          title: lesson.path || lesson.title,
          active: state.activeLessonId === lesson.id,
          onClick: () => {
            state.activeLessonId = lesson.id;
            state.lessonShowCode = false;
            renderLeconsSidebar();
            updateLeconsView();
          }
        })
      );
    }
  }

  function renderLeconsCards() {
    if (!els.leconsCards) {
      return;
    }
    clearElement(els.leconsCards);
    const leconsQuery = els.leconsSearch ? fold((els.leconsSearch.value || '').trim()) : '';
    const lessons = state.lessons.filter(
      (lesson) => !leconsQuery || fold(String(lesson.number || '')).includes(leconsQuery)
    );
    show(els.leconsEmptyHint, state.lessons.length === 0);
    for (const lesson of lessons) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'lesson-card';
      card.title = lesson.path || lesson.title;
      const number = document.createElement('span');
      number.className = 'lesson-card-number';
      number.textContent = lesson.number ? String(lesson.number) : '–';
      card.appendChild(number);
      const title = document.createElement('span');
      title.className = 'lesson-card-title';
      title.textContent = lesson.title || lesson.fileName;
      card.appendChild(title);
      const hint = document.createElement('span');
      hint.className = 'lesson-card-hint';
      hint.textContent = lesson.updatedAt
        ? `modifiée le ${new Date(lesson.updatedAt).toLocaleDateString('fr-FR')}`
        : '';
      card.appendChild(hint);
      card.addEventListener('click', () => {
        state.activeLessonId = lesson.id;
        state.lessonShowCode = false;
        renderLeconsSidebar();
        updateLeconsView();
      });
      els.leconsCards.appendChild(card);
    }
  }

  function updateLeconsView() {
    const hasLesson = !!getActiveLesson();
    show(els.leconsHome, !hasLesson);
    show(els.lessonEdit, hasLesson);
    if (hasLesson) {
      renderLessonEditor();
    } else {
      renderLeconsCards();
    }
  }

  function renderLessonEditor() {
    const lesson = getActiveLesson();
    if (!lesson) {
      return;
    }
    if (els.lessonNumberLabel) {
      els.lessonNumberLabel.textContent = lesson.number ? `Leçon ${lesson.number}` : 'Leçon';
    }
    if (els.lessonTitleInput && document.activeElement !== els.lessonTitleInput) {
      els.lessonTitleInput.value = lesson.title || '';
    }
    if (els.lessonTexInput && document.activeElement !== els.lessonTexInput) {
      els.lessonTexInput.value = lesson.content || '';
    }
    if (els.lessonSaveStatus) {
      els.lessonSaveStatus.textContent = lesson.path ? `Fichier : ${lesson.fileName}` : '';
    }
    renderLessonImportList();
    renderLessonRenderView();
    updateLessonModeVisibility();
  }

  let lessonRenderSeq = 0;

  async function getLessonNotions(lesson) {
    if (!lesson || !lesson.content) {
      return [];
    }
    if (!window.api.parseDevContent) {
      return [];
    }
    const seq = ++lessonRenderSeq;
    const result = await window.api.parseDevContent(lesson.content);
    if (seq !== lessonRenderSeq) {
      return null;
    }
    if (!result || !Array.isArray(result.notions)) {
      return { notions: [], sections: [], outline: [] };
    }
    return result;
  }

  async function renderLessonRenderView() {
    if (!els.lessonRenderView) {
      return;
    }
    const lesson = getActiveLesson();
    clearElement(els.lessonRenderView);
    const parsed = await getLessonNotions(lesson);
    if (parsed === null) {
      return;
    }
    if (state.section !== 'lecons' || state.activeLessonId !== (lesson && lesson.id)) {
      return;
    }
    const notions = parsed.notions || [];
    const outline = parsed.outline || [];
    if (outline.length > 0) {
      els.lessonRenderView.appendChild(buildOutlineFragment(outline, getSettingsMacros()));
      return;
    }
    if (notions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.style.padding = '24px 16px';
      empty.textContent = lesson && lesson.content
        ? 'Aucun environnement reconnu — utilisez « Code source » pour rédiger en LaTeX libre.'
        : 'Plan vide — « Code source » pour commencer à rédiger.';
      els.lessonRenderView.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    for (const notion of notions) {
      frag.appendChild(buildDevNotionBlock(notion));
    }
    els.lessonRenderView.appendChild(frag);
  }

  function updateLessonModeVisibility() {
    if (els.lessonRenderView) {
      show(els.lessonRenderView, !state.lessonShowCode);
    }
    if (els.lessonTexInput) {
      show(els.lessonTexInput, state.lessonShowCode);
    }
    if (els.lessonViewCodeBtn) {
      els.lessonViewCodeBtn.textContent = state.lessonShowCode ? 'Aperçu rendu' : 'Code source';
    }
  }

  function getImportableNotions() {
    const seen = new Set();
    const unique = [];
    for (const notion of state.notions) {
      if (seen.has(notion.id)) {
        continue;
      }
      seen.add(notion.id);
      unique.push(notion);
    }
    return unique;
  }

  function renderLessonImportList() {
    if (!els.lessonImportList) {
      return;
    }
    clearElement(els.lessonImportList);
    const q = fold((els.lessonImportSearch && els.lessonImportSearch.value) || '');
    const notions = getImportableNotions();
    let shown = 0;
    const frag = document.createDocumentFragment();
    for (const notion of notions) {
      if (q && !(
        fold(notion.title).includes(q)
        || fold(notion.environmentDisplay).includes(q)
        || fold(notion.course).includes(q)
        || fold(notion.body).includes(q)
      )) {
        continue;
      }
      if (shown >= 200) {
        break;
      }
      shown++;
      const item = document.createElement('div');
      item.className = 'lesson-import-item';
      item.title = `${notion.environmentDisplay} — ${courseNameToTitle(notion.course)} — clic : insérer dans la leçon`;
      const env = document.createElement('span');
      env.className = 'lesson-import-env';
      env.textContent = notion.environmentDisplay || notion.environment;
      env.style.color = notionEnvColor(notion);
      item.appendChild(env);
      const label = document.createElement('span');
      label.className = 'lesson-import-label';
      label.textContent = notion.title;
      label.style.color = notionEnvColor(notion);
      item.appendChild(label);
      const course = document.createElement('span');
      course.className = 'lesson-import-course';
      course.textContent = courseNameToTitle(notion.course);
      item.appendChild(course);
      item.addEventListener('click', () => {
        insertLatexInLesson(notionToLatex(notion));
      });
      frag.appendChild(item);
    }
    els.lessonImportList.appendChild(frag);
    if (shown === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = state.notions.length === 0
        ? 'Aucune notion — sélectionnez un dossier de cours'
        : 'Aucune notion trouvée';
      els.lessonImportList.appendChild(empty);
    }
  }

  function insertLatexInLesson(latex) {
    if (!els.lessonTexInput) {
      return;
    }
    const lesson = getActiveLesson();
    if (!lesson) {
      return;
    }
    if (!state.lessonShowCode) {
      state.lessonShowCode = true;
      updateLessonModeVisibility();
    }
    const input = els.lessonTexInput;
    const value = input.value;
    let insert = latex;
    let start = input.selectionStart;
    let end = input.selectionEnd;
    if (start !== end) {
      insert = value.slice(0, start) + latex + value.slice(end);
      start = start;
      end = start + latex.length;
    } else if (value.length > 0 && !/\n$/.test(value.slice(0, start))) {
      insert = value.slice(0, start) + '\n\n' + latex + value.slice(end);
      start = start + 2;
      end = start + latex.length;
    } else {
      insert = value.slice(0, start) + latex + value.slice(end);
      start = start + latex.length;
      end = start;
    }
    input.value = insert;
    lesson.content = insert;
    input.focus();
    input.setSelectionRange(Math.min(start, end), Math.max(start, end));
    scheduleLessonSave();
  }

  function showCreateLessonForm() {
    if (!state.scan) {
      return;
    }
    show(els.lessonCreateForm, true);
    if (els.lessonCreateNumber) {
      els.lessonCreateNumber.value = '';
      els.lessonCreateNumber.focus();
    }
  }

  function hideCreateLessonForm() {
    show(els.lessonCreateForm, false);
  }

  async function createNewLesson(numberOverride) {
    const numberStr = numberOverride !== undefined && numberOverride !== null
      ? String(numberOverride)
      : (els.lessonCreateNumber && els.lessonCreateNumber.value
        ? els.lessonCreateNumber.value.trim()
        : '');
    const number = numberStr ? parseInt(numberStr, 10) : null;
    if (!number || Number.isNaN(number) || number <= 0) {
      if (els.lessonSaveStatus) {
        els.lessonSaveStatus.textContent = 'Numéro requis';
      }
      return;
    }
    const planCount = state.lessons.filter((l) => l.number === number).length;
    const title = `Plan ${planCount + 1}`;
    const lesson = {
      id: `pending::${Date.now()}`,
      path: null,
      fileName: null,
      number,
      title,
      content: '% Plan de la leçon…\n\n',
      updatedAt: null
    };
    const result = await window.api.saveLesson(lesson);
    if (result && result.lesson && !result.error) {
      hideCreateLessonForm();
      await loadLessons();
      if (state.section === 'oral') {
        state.activeOralNumber = null;
        switchSection('lecons');
      }
      state.activeLessonId = result.lesson.id;
      state.lessonShowCode = true;
      renderLeconsSidebar();
      updateLeconsView();
      if (els.lessonTitleInput) {
        els.lessonTitleInput.focus();
        els.lessonTitleInput.select();
      }
    } else if (els.lessonSaveStatus) {
      els.lessonSaveStatus.textContent = `Erreur : ${(result && result.error) || 'création impossible'}`;
    }
  }

  async function deleteActiveLesson() {
    const lesson = getActiveLesson();
    if (!lesson || !lesson.path) {
      return;
    }
    const ok = await showAppDialog({
      mode: 'confirm',
      title: `Supprimer le plan « ${lesson.title || lesson.fileName} » ?`,
      message: `Le fichier ${lesson.fileName} sera supprimé du dossier de cours.`,
      okLabel: 'Supprimer'
    });
    if (!ok) {
      return;
    }
    const result = await window.api.deleteLesson(lesson.path);
    if (result && !result.error) {
      state.activeLessonId = null;
      await loadLessons();
      renderLeconsSidebar();
      updateLeconsView();
    }
  }

  /* ---------- Développements ---------- */

  let devSaveTimer = null;
  let devSaveSeq = 0;

  function getActiveDev() {
    return state.devs.find((d) => d.id === state.activeDevId) || null;
  }

  async function loadDevs() {
    if (!window.api.listDevs) {
      return;
    }
    const result = await window.api.listDevs();
    state.devs = Array.isArray(result && result.devs) ? result.devs : [];
  }

  async function saveActiveDev() {
    const dev = getActiveDev();
    if (!dev) {
      return;
    }
    const seq = ++devSaveSeq;
    if (els.devSaveStatus) {
      els.devSaveStatus.textContent = 'Sauvegarde…';
    }
    const result = await window.api.saveDev({
      path: dev.path || null,
      fileName: dev.fileName || null,
      title: dev.title || '',
      lessonIds: Array.isArray(dev.lessonIds) ? dev.lessonIds : [],
      lessonNumbers: Array.isArray(dev.lessonNumbers) ? dev.lessonNumbers : [],
      content: dev.content || ''
    });
    if (seq !== devSaveSeq) {
      return;
    }
    if (result && result.dev && !result.error) {
      const idx = state.devs.findIndex((d) => d.id === dev.id);
      if (idx !== -1) {
        state.devs[idx] = result.dev;
      }
      if (els.devSaveStatus) {
        els.devSaveStatus.textContent = `Sauvegardé — ${result.dev.fileName}`;
      }
    } else if (els.devSaveStatus) {
      els.devSaveStatus.textContent = `Erreur : ${(result && result.error) || 'sauvegarde impossible'}`;
    }
  }

  function scheduleDevSave() {
    if (devSaveTimer) {
      clearTimeout(devSaveTimer);
    }
    devSaveTimer = setTimeout(() => {
      devSaveTimer = null;
      saveActiveDev();
    }, 600);
  }

  function renderDevsSidebar() {
    if (!els.devsList) {
      return;
    }
    clearElement(els.devsList);
    if (state.devs.length === 0) {
      els.devsList.appendChild(buildEmptyItem('Aucun développement'));
      return;
    }
    els.devsList.appendChild(buildGroupHeader('Développements', state.devs.length));
    for (const dev of state.devs) {
      els.devsList.appendChild(
        buildListItem({
          icon: '→',
          label: dev.title,
          title: dev.path || dev.title,
          active: state.activeDevId === dev.id,
          onClick: () => {
            state.activeDevId = dev.id;
            state.devShowCode = false;
            renderDevsSidebar();
            updateDevsView();
          }
        })
      );
    }
  }

  function formatDevLessonNumbers(dev) {
    const numbers = new Set(Array.isArray(dev.lessonNumbers) ? dev.lessonNumbers : []);
    if (Array.isArray(dev.lessonIds)) {
      for (const id of dev.lessonIds) {
        const lesson = state.lessons.find((l) => l.id === id);
        if (lesson && lesson.number) {
          numbers.add(lesson.number);
        }
      }
    }
    const sorted = Array.from(numbers).sort((a, b) => a - b);
    return sorted.join(', ');
  }

  function renderDevsCards() {
    if (!els.devsCards) {
      return;
    }
    clearElement(els.devsCards);
    const devsQuery = els.devsSearch ? fold((els.devsSearch.value || '').trim()) : '';
    const devs = state.devs.filter((dev) => {
      if (!devsQuery) {
        return true;
      }
      if (fold(dev.title || '').includes(devsQuery)) {
        return true;
      }
      const numbers = formatDevLessonNumbers(dev);
      return fold(numbers).includes(devsQuery);
    });
    show(els.devsEmptyHint, state.devs.length === 0);
    for (const dev of devs) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'lesson-card';
      card.title = dev.path || dev.title;
      const number = document.createElement('span');
      number.className = 'lesson-card-number';
      const numCount = (Array.isArray(dev.lessonNumbers) ? dev.lessonNumbers.length : 0)
        + (Array.isArray(dev.lessonIds) ? dev.lessonIds.length : 0);
      number.textContent = numCount > 0
        ? `Leçon${numCount > 1 ? 's' : ''} ${formatDevLessonNumbers(dev)}`
        : '–';
      card.appendChild(number);
      const title = document.createElement('span');
      title.className = 'lesson-card-title';
      title.textContent = dev.title || dev.fileName;
      card.appendChild(title);
      const hint = document.createElement('span');
      hint.className = 'lesson-card-hint';
      hint.textContent = dev.updatedAt
        ? `modifié le ${new Date(dev.updatedAt).toLocaleDateString('fr-FR')}`
        : '';
      card.appendChild(hint);
      card.addEventListener('click', () => {
        state.activeDevId = dev.id;
        state.devShowCode = false;
        renderDevsSidebar();
        updateDevsView();
      });
      els.devsCards.appendChild(card);
    }
  }

  function updateDevsView() {
    const hasDev = !!getActiveDev();
    show(els.devsHome, !hasDev);
    show(els.devEdit, hasDev);
    if (hasDev) {
      renderDevEditor();
    } else {
      renderDevsCards();
    }
  }

  function renderDevEditor() {
    const dev = getActiveDev();
    if (!dev) {
      return;
    }
    if (els.devTitleInput && document.activeElement !== els.devTitleInput) {
      els.devTitleInput.value = dev.title || '';
    }
    if (els.devTexInput && document.activeElement !== els.devTexInput) {
      els.devTexInput.value = dev.content || '';
    }
    if (els.devSaveStatus) {
      els.devSaveStatus.textContent = dev.path ? `Fichier : ${dev.fileName}` : '';
    }
    renderDevLessonsNumbers();
    renderDevLessonsList();
    renderDevImportList();
    renderDevRenderView();
    updateDevModeVisibility();
  }

  let devRenderSeq = 0;

  async function getDevNotions(dev) {
    if (!dev || !dev.content) {
      return [];
    }
    if (!window.api.parseDevContent) {
      return [];
    }
    const seq = ++devRenderSeq;
    const result = await window.api.parseDevContent(dev.content);
    if (seq !== devRenderSeq) {
      return null;
    }
    if (!result || !Array.isArray(result.notions)) {
      return { notions: [], sections: [], outline: [] };
    }
    return result;
  }

  const SECTION_LEVEL_CLASS = ['outline-chapter', 'outline-section', 'outline-subsection', 'outline-subsubsection'];

  function buildOutlineFragment(outline, macros, options) {
    const frag = document.createDocumentFragment();
    for (const item of outline) {
      if (item.type === 'section') {
        const heading = document.createElement('div');
        heading.className = `outline-heading ${SECTION_LEVEL_CLASS[item.level] || 'outline-section'}`;
        heading.innerHTML = renderLatexText(item.title || '', macros);
        frag.appendChild(heading);
      } else if (item.type === 'text') {
        const body = renderLatexBody(item.text, macros);
        body.classList.add('outline-text');
        frag.appendChild(body);
      } else if (item.type === 'notion') {
        frag.appendChild(buildDevNotionBlock(item, options));
      }
    }
    return frag;
  }

  function buildDevNotionBlock(notion, opts) {
    const options = opts || {};
    const macros = getSettingsMacros();
    const card = document.createElement('div');
    card.className = 'notion dev-block';
    if (options.compactHeader) {
      card.classList.add('compact-notion');
      const body = renderLatexBody(notion.body, macros);
      const label = document.createElement('span');
      label.className = 'notion-type-label';
      label.textContent = `${notion.environmentDisplay || notion.environment} : `;
      const firstP = body.querySelector('p');
      if (firstP) {
        firstP.insertBefore(label, firstP.firstChild);
      } else {
        body.insertBefore(label, body.firstChild);
      }
      card.appendChild(body);
    } else {
      const header = document.createElement('div');
      header.className = 'notion-header';
      const env = document.createElement('span');
      env.className = 'notion-env';
      env.textContent = notion.environmentDisplay || notion.environment;
      header.appendChild(env);
      const title = document.createElement('span');
      title.className = 'notion-title';
      title.innerHTML = renderLatexText(notion.title || '', macros);
      header.appendChild(title);
      card.appendChild(header);
      const body = renderLatexBody(notion.body, macros);
      card.appendChild(body);
    }
    for (const proof of notion.proofs || []) {
      card.appendChild(buildProofSection(proof));
    }
    return card;
  }

  async function renderDevRenderView() {
    if (!els.devRenderView) {
      return;
    }
    const dev = getActiveDev();
    clearElement(els.devRenderView);
    const parsed = await getDevNotions(dev);
    if (parsed === null) {
      return;
    }
    if (state.section !== 'developpements' || state.activeDevId !== (dev && dev.id)) {
      return;
    }
    const notions = parsed.notions || [];
    const outline = parsed.outline || [];
    if (outline.length > 0) {
      els.devRenderView.appendChild(buildOutlineFragment(outline, getSettingsMacros()));
      return;
    }
    if (notions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.style.padding = '24px 16px';
      empty.textContent = dev && dev.content
        ? 'Aucun environnement reconnu — utilisez « Code source » pour rédiger en LaTeX libre.'
        : 'Développement vide — « Code source » pour commencer à rédiger.';
      els.devRenderView.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    for (const notion of notions) {
      frag.appendChild(buildDevNotionBlock(notion));
    }
    els.devRenderView.appendChild(frag);
  }

  function updateDevModeVisibility() {
    if (els.devRenderView) {
      show(els.devRenderView, !state.devShowCode);
    }
    if (els.devTexInput) {
      show(els.devTexInput, state.devShowCode);
    }
    if (els.devViewCodeBtn) {
      els.devViewCodeBtn.textContent = state.devShowCode ? 'Aperçu rendu' : 'Code source';
    }
  }

  function renderDevLessonsNumbers() {
    if (!els.devLessonsNumbers) {
      return;
    }
    const dev = getActiveDev();
    if (document.activeElement === els.devLessonsNumbers) {
      return;
    }
    const numbers = dev && Array.isArray(dev.lessonNumbers) ? dev.lessonNumbers : [];
    els.devLessonsNumbers.value = numbers.join(', ');
  }

  function setDevLessonNumbersFromInput() {
    const dev = getActiveDev();
    if (!dev || !els.devLessonsNumbers) {
      return;
    }
    const raw = els.devLessonsNumbers.value;
    const numbers = [];
    for (const part of raw.split(/[,;\s]+/)) {
      if (!part) {
        continue;
      }
      const num = parseInt(part, 10);
      if (Number.isInteger(num) && num > 0 && !numbers.includes(num)) {
        numbers.push(num);
      }
    }
    numbers.sort((a, b) => a - b);
    dev.lessonNumbers = numbers;
    scheduleDevSave();
  }

  function renderDevLessonsList() {
    if (!els.devLessonsList) {
      return;
    }
    clearElement(els.devLessonsList);
    if (state.lessons.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = 'Aucun plan — créez-en un dans la section Plans';
      els.devLessonsList.appendChild(empty);
      return;
    }
    const frag = document.createDocumentFragment();
    for (const lesson of state.lessons) {
      const label = document.createElement('label');
      label.className = 'dev-lesson-check';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = devLessonChecked(lesson.id);
      box.addEventListener('change', () => {
        toggleDevLesson(lesson.id, box.checked);
      });
      label.appendChild(box);
      const text = document.createElement('span');
      text.className = 'dev-lesson-label';
      text.textContent = lesson.number ? `${lesson.number}. ${lesson.title}` : lesson.title;
      label.appendChild(text);
      frag.appendChild(label);
    }
    els.devLessonsList.appendChild(frag);
  }

  function devLessonChecked(lessonId) {
    const dev = getActiveDev();
    return !!(dev && Array.isArray(dev.lessonIds) && dev.lessonIds.includes(lessonId));
  }

  function toggleDevLesson(lessonId, checked) {
    const dev = getActiveDev();
    if (!dev) {
      return;
    }
    if (!Array.isArray(dev.lessonIds)) {
      dev.lessonIds = [];
    }
    if (checked && !dev.lessonIds.includes(lessonId)) {
      dev.lessonIds.push(lessonId);
    }
    if (!checked) {
      dev.lessonIds = dev.lessonIds.filter((id) => id !== lessonId);
    }
    scheduleDevSave();
  }

  function renderDevImportList() {
    if (!els.devImportList) {
      return;
    }
    clearElement(els.devImportList);
    const q = fold((els.devImportSearch && els.devImportSearch.value) || '');
    const notions = getImportableNotions();
    let shown = 0;
    const frag = document.createDocumentFragment();
    for (const notion of notions) {
      if (q && !(
        fold(notion.title).includes(q)
        || fold(notion.environmentDisplay).includes(q)
        || fold(notion.course).includes(q)
        || fold(notion.body).includes(q)
      )) {
        continue;
      }
      if (shown >= 200) {
        break;
      }
      shown++;
      const item = document.createElement('div');
      item.className = 'lesson-import-item';
      item.title = `${notion.environmentDisplay} — ${courseNameToTitle(notion.course)} — clic : insérer dans le développement`;
      const env = document.createElement('span');
      env.className = 'lesson-import-env';
      env.textContent = notion.environmentDisplay || notion.environment;
      env.style.color = notionEnvColor(notion);
      item.appendChild(env);
      const label = document.createElement('span');
      label.className = 'lesson-import-label';
      label.textContent = notion.title;
      label.style.color = notionEnvColor(notion);
      item.appendChild(label);
      const course = document.createElement('span');
      course.className = 'lesson-import-course';
      course.textContent = courseNameToTitle(notion.course);
      item.appendChild(course);
      item.addEventListener('click', () => {
        insertLatexInDev(notionToLatex(notion));
      });
      frag.appendChild(item);
    }
    els.devImportList.appendChild(frag);
    if (shown === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = state.notions.length === 0
        ? 'Aucune notion — sélectionnez un dossier de cours'
        : 'Aucune notion trouvée';
      els.devImportList.appendChild(empty);
    }
  }

  function insertLatexInDev(latex) {
    if (!els.devTexInput) {
      return;
    }
    const dev = getActiveDev();
    if (!dev) {
      return;
    }
    if (!state.devShowCode) {
      state.devShowCode = true;
      updateDevModeVisibility();
    }
    const input = els.devTexInput;
    const value = input.value;
    let insert = latex;
    let start = input.selectionStart;
    let end = input.selectionEnd;
    if (start !== end) {
      insert = value.slice(0, start) + latex + value.slice(end);
      end = start + latex.length;
    } else if (value.length > 0 && !/\n$/.test(value.slice(0, start))) {
      insert = value.slice(0, start) + '\n\n' + latex + value.slice(end);
      start = start + 2;
      end = start + latex.length;
    } else {
      insert = value.slice(0, start) + latex + value.slice(end);
      start = start + latex.length;
      end = start;
    }
    input.value = insert;
    dev.content = insert;
    input.focus();
    input.setSelectionRange(Math.min(start, end), Math.max(start, end));
    scheduleDevSave();
  }

  function showCreateDevForm() {
    if (!state.scan) {
      return;
    }
    show(els.devCreateForm, true);
    if (els.devCreateTitle) {
      els.devCreateTitle.value = '';
      els.devCreateTitle.focus();
    }
  }

  function hideCreateDevForm() {
    show(els.devCreateForm, false);
  }

  async function createNewDev() {
    const title = els.devCreateTitle && els.devCreateTitle.value
      ? els.devCreateTitle.value.trim()
      : '';
    const dev = {
      id: `pending::${Date.now()}`,
      path: null,
      fileName: null,
      title: title || 'Nouveau développement',
      lessonIds: [],
      lessonNumbers: [],
      content: '% Développement…\n\n',
      updatedAt: null
    };
    const result = await window.api.saveDev(dev);
    if (result && result.dev && !result.error) {
      hideCreateDevForm();
      await loadDevs();
      state.activeDevId = result.dev.id;
      renderDevsSidebar();
      updateDevsView();
      if (els.devTitleInput) {
        els.devTitleInput.focus();
        els.devTitleInput.select();
      }
    } else if (els.devSaveStatus) {
      els.devSaveStatus.textContent = `Erreur : ${(result && result.error) || 'création impossible'}`;
    }
  }

  async function deleteActiveDev() {
    const dev = getActiveDev();
    if (!dev || !dev.path) {
      return;
    }
    const ok = await showAppDialog({
      mode: 'confirm',
      title: `Supprimer le développement « ${dev.title || dev.fileName} » ?`,
      message: `Le fichier ${dev.fileName} sera supprimé du dossier de cours.`,
      okLabel: 'Supprimer'
    });
    if (!ok) {
      return;
    }
    const result = await window.api.deleteDev(dev.path);
    if (result && !result.error) {
      state.activeDevId = null;
      await loadDevs();
      renderDevsSidebar();
      updateDevsView();
    }
  }

  /* ---------- Events ---------- */

  els.openFolderBtn.addEventListener('click', openFolderDialog);
  els.rescanBtn.addEventListener('click', () => rescan({ preserve: true }));

  if (els.lessonBack) {
    els.lessonBack.addEventListener('click', async () => {
      if (lessonSaveTimer) {
        clearTimeout(lessonSaveTimer);
        lessonSaveTimer = null;
      }
      await saveActiveLesson();
      state.activeLessonId = null;
      state.lessonShowCode = false;
      renderLeconsSidebar();
      updateLeconsView();
    });
  }
  if (els.lessonCreateBtn) {
    els.lessonCreateBtn.addEventListener('click', showCreateLessonForm);
  }
  if (els.lessonCreateConfirm) {
    els.lessonCreateConfirm.addEventListener('click', () => createNewLesson());
  }
  if (els.lessonCreateCancel) {
    els.lessonCreateCancel.addEventListener('click', hideCreateLessonForm);
  }
  if (els.lessonCreateNumber) {
    els.lessonCreateNumber.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        createNewLesson();
      }
      if (event.key === 'Escape') {
        hideCreateLessonForm();
      }
    });
  }
  if (els.lessonDeleteBtn) {
    els.lessonDeleteBtn.addEventListener('click', deleteActiveLesson);
  }
  if (els.lessonTitleInput) {
    els.lessonTitleInput.addEventListener('input', () => {
      const lesson = getActiveLesson();
      if (!lesson) {
        return;
      }
      lesson.title = els.lessonTitleInput.value.trim() || 'Nouvelle leçon';
      scheduleLessonSave();
    });
  }
  if (els.lessonTexInput) {
    els.lessonTexInput.addEventListener('input', () => {
      const lesson = getActiveLesson();
      if (!lesson) {
        return;
      }
      lesson.content = els.lessonTexInput.value;
      scheduleLessonSave();
    });
  }
  if (els.lessonViewCodeBtn) {
    els.lessonViewCodeBtn.addEventListener('click', () => {
      state.lessonShowCode = !state.lessonShowCode;
      if (!state.lessonShowCode) {
        renderLessonRenderView();
      }
      updateLessonModeVisibility();
    });
  }
  if (els.lessonImportSearch) {
    let importSearchTimer = null;
    els.lessonImportSearch.addEventListener('input', () => {
      if (importSearchTimer) {
        clearTimeout(importSearchTimer);
      }
      importSearchTimer = setTimeout(renderLessonImportList, 120);
    });
  }

  if (els.devBack) {
    els.devBack.addEventListener('click', async () => {
      if (devSaveTimer) {
        clearTimeout(devSaveTimer);
        devSaveTimer = null;
      }
      await saveActiveDev();
      state.activeDevId = null;
      renderDevsSidebar();
      updateDevsView();
    });
  }
  if (els.oralCreateBtn) {
    els.oralCreateBtn.addEventListener('click', showCreateOralForm);
  }
  if (els.oralCreateConfirm) {
    els.oralCreateConfirm.addEventListener('click', createOralLesson);
  }
  if (els.oralCreateCancel) {
    els.oralCreateCancel.addEventListener('click', hideCreateOralForm);
  }
  if (els.oralCreateTitle) {
    els.oralCreateTitle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        createOralLesson();
      }
      if (event.key === 'Escape') {
        hideCreateOralForm();
      }
    });
  }
  if (els.oralCreateNumber) {
    els.oralCreateNumber.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        createOralLesson();
      }
      if (event.key === 'Escape') {
        hideCreateOralForm();
      }
    });
  }
  if (els.oralBack) {
    els.oralBack.addEventListener('click', () => {
      state.activeOralNumber = null;
      state.activeOralPlanId = null;
      state.activeOralDevId = null;
      renderOralSidebar();
      updateOralView();
    });
  }
  if (els.oralPlanBackBtn) {
    els.oralPlanBackBtn.addEventListener('click', () => {
      state.activeOralPlanId = null;
      updateOralPlanPreviewVisibility();
      renderOralPlansList();
    });
  }
  if (els.oralPlanOpenEditorBtn) {
    els.oralPlanOpenEditorBtn.addEventListener('click', openOralPlanInLessons);
  }
  if (els.oralDevBackBtn) {
    els.oralDevBackBtn.addEventListener('click', () => {
      state.activeOralDevId = null;
      updateOralDevPreviewVisibility();
      renderOralDevsList();
    });
  }
  if (els.oralDevOpenEditorBtn) {
    els.oralDevOpenEditorBtn.addEventListener('click', openOralDevInDevs);
  }
  if (els.oralSearch) {
    els.oralSearch.addEventListener('input', () => {
      if (state.section === 'oral' && state.activeOralNumber === null) {
        renderOralCards();
        renderOralSidebar();
      }
    });
  }
  if (els.leconsSearch) {
    els.leconsSearch.addEventListener('input', () => {
      if (state.section === 'lecons' && state.activeLessonId === null) {
        renderLeconsCards();
      }
    });
  }
  if (els.devsSearch) {
    els.devsSearch.addEventListener('input', () => {
      if (state.section === 'developpements' && state.activeDevId === null) {
        renderDevsCards();
      }
    });
  }
  if (els.devCreateBtn) {
    els.devCreateBtn.addEventListener('click', showCreateDevForm);
  }
  if (els.devCreateConfirm) {
    els.devCreateConfirm.addEventListener('click', createNewDev);
  }
  if (els.devCreateCancel) {
    els.devCreateCancel.addEventListener('click', hideCreateDevForm);
  }
  if (els.devCreateTitle) {
    els.devCreateTitle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        createNewDev();
      }
      if (event.key === 'Escape') {
        hideCreateDevForm();
      }
    });
  }
  if (els.devDeleteBtn) {
    els.devDeleteBtn.addEventListener('click', deleteActiveDev);
  }
  if (els.devTitleInput) {
    els.devTitleInput.addEventListener('input', () => {
      const dev = getActiveDev();
      if (!dev) {
        return;
      }
      dev.title = els.devTitleInput.value.trim() || 'Nouveau développement';
      scheduleDevSave();
    });
  }
  if (els.devTexInput) {
    els.devTexInput.addEventListener('input', () => {
      const dev = getActiveDev();
      if (!dev) {
        return;
      }
      dev.content = els.devTexInput.value;
      scheduleDevSave();
    });
  }
  if (els.devViewCodeBtn) {
    els.devViewCodeBtn.addEventListener('click', () => {
      state.devShowCode = !state.devShowCode;
      if (!state.devShowCode) {
        renderDevRenderView();
      }
      updateDevModeVisibility();
    });
  }
  if (els.devLessonsNumbers) {
    els.devLessonsNumbers.addEventListener('input', () => {
      setDevLessonNumbersFromInput();
    });
    els.devLessonsNumbers.addEventListener('blur', () => {
      renderDevLessonsNumbers();
    });
  }
  if (els.devImportSearch) {
    let devImportTimer = null;
    els.devImportSearch.addEventListener('input', () => {
      if (devImportTimer) {
        clearTimeout(devImportTimer);
      }
      devImportTimer = setTimeout(renderDevImportList, 120);
    });
  }

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

  /* ---------- Mise à jour automatique ---------- */

  const updateBanner = document.getElementById('update-banner');

  function formatBytes(bytes) {
    if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0) {
      return '';
    }
    if (bytes < 1024 * 1024) {
      return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  function renderUpdateBanner(status) {
    if (!updateBanner) {
      return;
    }
    updateBanner.classList.remove('hidden', 'error');
    updateBanner.textContent = '';
    if (status.error) {
      updateBanner.classList.add('error');
      const label = document.createElement('span');
      label.className = 'update-label';
      label.textContent = 'Échec de la mise à jour.';
      label.title = status.error;
      updateBanner.appendChild(label);
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = 'Réessayer';
      retry.addEventListener('click', async () => {
        await window.api.checkUpdates();
      });
      updateBanner.appendChild(retry);
      return;
    }
    if (status.downloaded) {
      const label = document.createElement('span');
      label.className = 'update-label';
      label.textContent = `v${status.version} prête — redémarrer pour appliquer.`;
      updateBanner.appendChild(label);
      const install = document.createElement('button');
      install.type = 'button';
      install.textContent = 'Redémarrer';
      install.addEventListener('click', () => {
        window.api.installUpdate();
      });
      updateBanner.appendChild(install);
      return;
    }
    if (status.available) {
      const label = document.createElement('span');
      label.className = 'update-label';
      if (status.progress && typeof status.progress.percent === 'number') {
        const transferred = formatBytes(status.progress.transferred);
        const total = formatBytes(status.progress.total);
        const detail = transferred && total ? ` (${transferred} / ${total})` : '';
        label.textContent = `Téléchargement de v${status.version}… ${status.progress.percent} %${detail}`;
      } else {
        label.textContent = `Mise à jour v${status.version} disponible…`;
      }
      updateBanner.appendChild(label);
      return;
    }
    updateBanner.classList.add('hidden');
  }

  async function initUpdateBanner() {
    if (!updateBanner) {
      return;
    }
    window.api.onUpdateStatus(renderUpdateBanner);
    try {
      const status = await window.api.getUpdateStatus();
      renderUpdateBanner(status);
    } catch (error) {
      updateBanner.classList.add('hidden');
    }
  }

  /* ---------- Init ---------- */

  async function applyAppTitle() {
    try {
      const version = await window.api.getVersion();
      document.title = `Application Mathématiques v${version}`;
    } catch (error) {
      document.title = 'Application Mathématiques';
    }
  }

  async function init() {
    const stateResult = await window.api.getState();
    if (stateResult.prefsError) {
      console.error('prefsError:', stateResult.prefsError);
    }
    if (stateResult.folder) {
      els.folderDisplay.textContent = stateResult.folder;
      els.folderDisplay.title = stateResult.folder;
      await rescan();
    } else {
      renderSidebar();
    }
    await loadLessons();
    renderLeconsSidebar();
    updateLeconsView();
    await loadDevs();
    renderDevsSidebar();
    updateDevsView();
    await loadOralLessons();
    renderOralSidebar();
    updateOralView();
  }

  initUpdateBanner();
  applyAppTitle();
  loadLessons();
  init();
})();
