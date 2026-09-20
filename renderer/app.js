'use strict';

(function () {
  if (typeof pdfjsLib !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../vendor/pdfjs/pdf.worker.min.js';
  }

  const els = {
    activityIcons: document.querySelectorAll('.activity-icon'),
    openFolderBtn: document.getElementById('btn-open-folder'),
    rescanBtn: document.getElementById('btn-rescan'),
    folderDisplay: document.getElementById('folder-display'),
    coursList: document.getElementById('cours-list'),
    notionsList: document.getElementById('notions-list'),
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
    notionsSearch: document.getElementById('notions-search'),
    notionsCount: document.getElementById('notions-count'),
    notionTabs: document.getElementById('notion-tabs'),
    notionViews: document.getElementById('notion-views'),
    notionsEmptyOpen: document.getElementById('notions-empty-open')
  };

  const state = {
    section: 'cours',
    scan: null,
    activePdf: null,
    notions: [],
    openNotions: [],
    activeNotionId: null,
    notionFilter: ''
  };

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
    '\\qedhere': ''
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

  function renderLatexText(text, macros) {
    if (!text) {
      return '';
    }
    const mathSpans = [];
    const protectedText = text.replace(/\$([^$\n]+)\$/g, (_m, inner) => {
      mathSpans.push(inner);
      return `\u0000${mathSpans.length - 1}\u0000`;
    });
    let html = applyTextTransforms(escapeHtml(protectedText));
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

  function buildGroupHeader(labelText, count) {
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
    clearElement(els.notionsList);

    if (!state.scan) {
      els.coursList.appendChild(buildEmptyItem('Sélectionnez un dossier'));
      els.notionsList.appendChild(buildEmptyItem('Sélectionnez un dossier'));
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

    renderNotionsDirectory();
  }

  function notionMatchesFilter(notion) {
    if (!state.notionFilter) {
      return true;
    }
    const f = state.notionFilter;
    return (
      notion.title.toLowerCase().includes(f) ||
      notion.environment.toLowerCase().includes(f) ||
      (notion.environmentDisplay || '').toLowerCase().includes(f) ||
      (notion.course || '').toLowerCase().includes(f)
    );
  }

  function renderNotionsDirectory() {
    clearElement(els.notionsList);
    if (state.notions.length === 0) {
      els.notionsList.appendChild(buildEmptyItem('Aucune notion détectée'));
      els.notionsCount.textContent = '';
      return;
    }

    const filter = state.notionFilter;
    const courses = new Map();
    for (const notion of state.notions) {
      if (!notionMatchesFilter(notion)) {
        continue;
      }
      if (!courses.has(notion.course)) {
        courses.set(notion.course, []);
      }
      courses.get(notion.course).push(notion);
    }

    let visible = 0;
    if (courses.size === 0) {
      els.notionsList.appendChild(buildEmptyItem('Aucun résultat'));
    } else {
      for (const [courseName, notions] of courses) {
        const group = buildGroupHeader(courseName, notions.length);
        els.notionsList.appendChild(group);
        for (const notion of notions) {
          visible++;
          const isOpen = state.openNotions.some((n) => n.id === notion.id);
          els.notionsList.appendChild(
            buildListItem({
              icon: isOpen ? '◉' : '•',
              label: notion.title,
              title: `${notion.environmentDisplay || notion.environment} — ${notion.title}`,
              active: state.activeNotionId === notion.id,
              onClick: () => openNotion(notion)
            })
          );
        }
      }
    }
    els.notionsCount.textContent = filter
      ? `${visible} / ${state.notions.length} notions`
      : `${state.notions.length} notions`;
  }

  /* ---------- Sections ---------- */

  function switchSection(section) {
    state.section = section;
    for (const btn of els.activityIcons) {
      btn.classList.toggle('active', btn.dataset.section === section);
    }
    show(els.coursList, section === 'cours');
    show(els.notionsList, section === 'notions');
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

  async function rescan() {
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
    state.scan = result;
    state.activePdf = null;
    state.notions = flattenNotions(result);
    state.openNotions = [];
    state.activeNotionId = null;
    els.folderDisplay.textContent = result.folder;
    els.folderDisplay.title = result.folder;
    renderSidebar();
    renderNotionTabs();
    updateMainView();
  }

  function flattenNotions(scan) {
    const notions = [];
    const displayMap = {};
    if (scan.settings && Array.isArray(scan.settings.environments)) {
      for (const env of scan.settings.environments) {
        displayMap[env.name] = env.display;
      }
    }
    const courses = Array.isArray(scan.courses) ? scan.courses : [];
    for (const course of courses) {
      const courseNotions = Array.isArray(course.notions) ? course.notions : [];
      courseNotions.forEach((notion) => {
        notions.push({
          ...notion,
          environmentDisplay: displayMap[notion.environment] || notion.environment,
          course: course.name,
          coursePath: course.path,
          id: `${course.name}::${notion.environment}::${notion.index}`
        });
      });
    }
    return notions;
  }

  /* ---------- PDF viewer (pdf.js embarqué) ---------- */

  const pdfViewer = {
    doc: null,
    pageCount: 0,
    scale: null,
    fitWidth: true,
    renderedPages: new Set(),
    pageJobs: new Map(),
    visiblePages: new Set()
  };

  function resetPdfViewer() {
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
      const context = canvas.getContext('2d');
      const renderOptions = { canvasContext: context, viewport };
      if (ratio !== 1) {
        renderOptions.transform = [ratio, 0, 0, ratio, 0, 0];
      }
      await page.render(renderOptions).promise;
      pageDiv.dataset.rendered = '1';
      pdfViewer.renderedPages.add(pageNum);
      try {
        const textLayerDiv = pageDiv.querySelector('.textLayer');
        const textContent = await page.getTextContent();
        const textLayerViewport = page.getViewport({ scale: viewportScale });
        textLayerDiv.innerHTML = '';
        for (const item of (textContent.items || [])) {
          if (!item.str) {
            continue;
          }
          const tx = pdfjsLib.Util.transform(textLayerViewport.transform, item.transform);
          const angle = Math.atan2(tx[1], tx[0]);
          const style = `left:${tx[4]}px; top:${tx[5]}px; font-size:${Math.hypot(tx[2], tx[3])}px; font-family:monospace;`;
          const span = document.createElement('span');
          span.setAttribute('style', style);
          if (angle) {
            span.style.transform = `rotate(${angle}rad)`;
          }
          span.textContent = item.str;
          textLayerDiv.appendChild(span);
        }
      } catch (err) {
        /* la couche texte est optionnelle, le canvas reste affiché */
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

  async function computeFitWidthScale() {
    if (!pdfViewer.doc) {
      return;
    }
    const page = await pdfViewer.doc.getPage(1);
    const baseViewport = page.getViewport({ scale: 1 });
    const available = Math.max(els.pdfContainer.clientWidth - 32, 200);
    pdfViewer.scale = available / baseViewport.width;
    pdfViewer.scale = Math.min(Math.max(pdfViewer.scale, 0.2), 5);
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
      textLayer.innerHTML = '';
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
    await computeFitWidthScale();
    updateZoomLabel();
    await buildPdfPagePlaceholders();
    els.pdfContainer.scrollTop = 0;
    scheduleVisibleUpdate();
    renderSidebar();
  }

  function changePdfZoom(factor) {
    if (!pdfViewer.doc || !pdfViewer.scale) {
      return;
    }
    pdfViewer.fitWidth = false;
    pdfViewer.scale = Math.min(Math.max(pdfViewer.scale * factor, 0.2), 5);
    updateZoomLabel();
    rerenderAllPages();
  }

  async function fitWidthZoom() {
    if (!pdfViewer.doc) {
      return;
    }
    pdfViewer.fitWidth = true;
    await computeFitWidthScale();
    updateZoomLabel();
    await rerenderAllPages();
  }

  els.pdfContainer.addEventListener('scroll', scheduleVisibleUpdate);
  window.addEventListener('resize', async () => {
    if (pdfViewer.doc && pdfViewer.fitWidth) {
      await computeFitWidthScale();
      updateZoomLabel();
      await rerenderAllPages();
    }
  });
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
    renderNotionsDirectory();
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
    renderNotionsDirectory();
  }

  function renderNotionTabs() {
    clearElement(els.notionTabs);
    show(els.notionTabs, state.openNotions.length > 0);
    for (const notion of state.openNotions) {
      const tab = document.createElement('div');
      tab.className = 'notion-tab' + (state.activeNotionId === notion.id ? ' active' : '');
      const label = document.createElement('span');
      label.className = 'notion-tab-label';
      label.textContent = notion.title;
      label.title = `${notion.environmentDisplay || notion.environment} — ${notion.title} (${notion.course})`;
      tab.appendChild(label);
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
        renderNotionsDirectory();
      });
      els.notionTabs.appendChild(tab);
    }
  }

  function renderNotionViews() {
    clearElement(els.notionViews);
    const hasOpen = state.openNotions.length > 0;
    show(els.notionsEmptyOpen, !hasOpen);
    if (!hasOpen) {
      return;
    }
    const macros = getSettingsMacros();
    for (const notion of state.openNotions) {
      const view = document.createElement('div');
      view.className = 'notion-view' + (state.activeNotionId === notion.id ? ' active' : '');
      view.dataset.notionId = notion.id;

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
      title.innerHTML = renderLatexText(fallbackTitle, macros);
      const source = document.createElement('span');
      source.className = 'notion-source';
      source.textContent = notion.course || '';
      header.appendChild(env);
      header.appendChild(title);
      header.appendChild(source);
      card.appendChild(header);

      const body = renderLatexBody(notion.body, macros);
      card.appendChild(body);

      const actions = document.createElement('div');
      actions.className = 'notion-actions';
      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'Copier le code LaTeX';
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(notionToLatex(notion));
          copyBtn.textContent = '✓ Copié !';
          setTimeout(() => {
            copyBtn.textContent = 'Copier le code LaTeX';
          }, 1500);
        } catch (err) {
          copyBtn.textContent = 'Échec de la copie';
          setTimeout(() => {
            copyBtn.textContent = 'Copier le code LaTeX';
          }, 1500);
        }
      });
      actions.appendChild(copyBtn);

      const sourceToggle = document.createElement('button');
      sourceToggle.textContent = 'Code source';
      sourceToggle.addEventListener('click', () => {
        card.classList.toggle('notions-showing-source');
        sourceToggle.textContent = card.classList.contains('notions-showing-source')
          ? 'Masquer le code'
          : 'Code source';
      });
      actions.appendChild(sourceToggle);
      card.appendChild(actions);

      const sourceCode = document.createElement('pre');
      sourceCode.className = 'notion-source-code';
      sourceCode.textContent = notionToLatex(notion);
      card.appendChild(sourceCode);

      view.appendChild(card);
      els.notionViews.appendChild(view);
    }
  }

  /* ---------- Events ---------- */

  els.openFolderBtn.addEventListener('click', openFolderDialog);
  els.rescanBtn.addEventListener('click', rescan);
  for (const btn of els.activityIcons) {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  }

  let searchTimer = null;
  els.notionsSearch.addEventListener('input', () => {
    state.notionFilter = els.notionsSearch.value.trim().toLowerCase();
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    searchTimer = setTimeout(renderNotionsDirectory, 120);
  });

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

  init();
})();
