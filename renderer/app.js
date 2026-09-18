'use strict';

(function () {
  if (window.pdfjsLib) {
    const workerUrl = new URL('../vendor/pdfjs/pdf.worker.min.js', document.baseURI).href;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
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
    pdfOutlinePanel: document.getElementById('pdf-outline-panel'),
    pdfOutlineList: document.getElementById('pdf-outline-list'),
    pdfToggleOutline: document.getElementById('pdf-toggle-outline'),
    pdfFirst: document.getElementById('pdf-first'),
    pdfPrev: document.getElementById('pdf-prev'),
    pdfNext: document.getElementById('pdf-next'),
    pdfLast: document.getElementById('pdf-last'),
    pdfPageInput: document.getElementById('pdf-page-input'),
    pdfPageTotal: document.getElementById('pdf-page-total'),
    pdfZoomIn: document.getElementById('pdf-zoom-in'),
    pdfZoomOut: document.getElementById('pdf-zoom-out'),
    pdfZoomValue: document.getElementById('pdf-zoom-value'),
    pdfFitWidth: document.getElementById('pdf-fit-width'),
    pdfContainer: document.getElementById('pdf-container'),
    pdfTitle: document.getElementById('pdf-title'),
    notionsSearch: document.getElementById('notions-search'),
    notionsContent: document.getElementById('notions-content'),
    copyLatexBtn: document.getElementById('btn-copy-latex'),
    toggleSourceBtn: document.getElementById('btn-toggle-source')
  };

  const state = {
    section: 'cours',
    scan: null,
    activePdf: null,
    showingSource: false,
    notions: [],
    pdf: null,
    pdfCurrentPage: 1,
    pdfZoomScale: null,
    pdfFitWidth: true,
    pdfOutline: [],
    pdfPages: [],
    pdfBaseWidth: null,
    appliedScale: null,
    pdfScrollTimer: null,
    pdfResizeTimer: null,
    notionsDirty: true
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

  function buildKatexMacros(macros) {
    const katexMacros = {};
    if (!Array.isArray(macros)) {
      return katexMacros;
    }
    for (const macro of macros) {
      if (macro && macro.name && typeof macro.body === 'string') {
        katexMacros[macro.name] = macro.body;
      }
    }
    return katexMacros;
  }

  function renderLatexBody(body, macros) {
    const container = document.createElement('div');
    container.className = 'notion-body';
    const rawText = body;
    const displayRe = /\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g;
    const inlineRe = /\$([^$\n]+)\$/g;

    function renderInline(text) {
      let html = '';
      let lastIndex = 0;
      inlineRe.lastIndex = 0;
      let m;
      while ((m = inlineRe.exec(text)) !== null) {
        html += escapeHtml(text.slice(lastIndex, m.index));
        try {
          html += katex.renderToString(m[1], {
            displayMode: false,
            macros: Object.assign({}, macros),
            throwOnError: false
          });
        } catch (err) {
          html += `<code class="latex-error">${escapeHtml(m[0])}</code>`;
        }
        lastIndex = m.index + m[0].length;
      }
      html += escapeHtml(text.slice(lastIndex));
      return html;
    }

    let html = '';
    let lastIndex = 0;
    displayRe.lastIndex = 0;
    let dm;
    while ((dm = displayRe.exec(rawText)) !== null) {
      html += renderInline(rawText.slice(lastIndex, dm.index));
      const formula = dm[1] !== undefined ? dm[1] : dm[2];
      try {
        html += katex.renderToString(formula, {
          displayMode: true,
          macros: Object.assign({}, macros),
          throwOnError: false
        });
      } catch (err) {
        html += `<code class="latex-error">${escapeHtml(dm[0])}</code>`;
      }
      lastIndex = dm.index + dm[0].length;
    }
    html += renderInline(rawText.slice(lastIndex));
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

  function renderSidebar() {
    clearElement(els.coursList);
    clearElement(els.notionsList);

    if (!state.scan) {
      els.coursList.appendChild(buildEmptyItem('Sélectionnez un dossier'));
      els.notionsList.appendChild(buildEmptyItem('—'));
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

    if (state.notions.length === 0) {
      els.notionsList.appendChild(buildEmptyItem('Aucune notion détectée'));
    } else {
      const grouped = groupNotionsByEnvironment(state.notions);
      for (const group of grouped) {
        els.notionsList.appendChild(buildGroupHeader(group.environment, group.notions.length));
        for (const notion of group.notions) {
          els.notionsList.appendChild(
            buildListItem({
              label: notion.title,
              title: `${notion.course} — ${notion.title}`,
              onClick: () => scrollToNotion(notion)
            })
          );
        }
      }
    }
  }

  function buildEmptyItem(text) {
    const div = document.createElement('div');
    div.className = 'list-empty';
    div.textContent = text;
    return div;
  }

  function groupNotionsByEnvironment(notions) {
    const map = new Map();
    for (const notion of notions) {
      if (!map.has(notion.environment)) {
        map.set(notion.environment, []);
      }
      map.get(notion.environment).push(notion);
    }
    return Array.from(map.entries()).map(([environment, list]) => ({
      environment,
      notions: list
    }));
  }

  function scrollToNotion(notion) {
    const target = document.getElementById(`notion-${notion.id}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
      if (state.notionsDirty) {
        renderNotions();
        state.notionsDirty = false;
      }
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
    state.notionsDirty = true;
    els.folderDisplay.textContent = result.folder;
    els.folderDisplay.title = result.folder;
    renderSidebar();
    updateMainView();
  }

  function flattenNotions(scan) {
    const notions = [];
    const courses = Array.isArray(scan.courses) ? scan.courses : [];
    for (const course of courses) {
      const courseNotions = Array.isArray(course.notions) ? course.notions : [];
      courseNotions.forEach((notion) => {
        notions.push({
          ...notion,
          course: course.name,
          coursePath: course.path,
          id: `${course.name}-${notion.index}`
        });
      });
    }
    return notions;
  }

  /* ---------- PDF viewer ---------- */

  async function openPdf(filePath) {
    state.activePdf = filePath;
    state.pdf = null;
    state.pdfOutline = [];
    state.pdfCurrentPage = 1;
    clearElement(els.pdfContainer);
    clearElement(els.pdfOutlineList);
    els.pdfTitle.textContent = basename(filePath);
    els.pdfPageInput.value = '1';
    els.pdfPageTotal.textContent = '/ …';

    const loading = document.createElement('div');
    loading.className = 'pdf-loading';
    loading.textContent = 'Chargement du PDF…';
    els.pdfContainer.appendChild(loading);

    const result = await window.api.readPdf(filePath);
    if (result.error) {
      loading.textContent = `Impossible de lire le PDF : ${result.error}`;
      loading.className = 'pdf-error';
      return;
    }
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: result.data }).promise;
      state.pdf = pdf;
      els.pdfPageTotal.textContent = `/ ${pdf.numPages}`;
      await loadOutline(pdf);
      await setupPdfPages();
    } catch (err) {
      loading.textContent = `Erreur PDF : ${err.message}`;
      loading.className = 'pdf-error';
    }
  }

  async function loadOutline(pdf) {
    state.pdfOutline = [];
    try {
      const outline = await pdf.getOutline();
      if (!outline || outline.length === 0) {
        renderOutlineList();
        return;
      }
      const flat = [];
      await flattenOutline(pdf, outline, 0, flat);
      state.pdfOutline = flat;
    } catch (err) {
      state.pdfOutline = [];
    }
    renderOutlineList();
  }

  async function flattenOutline(pdf, items, depth, out) {
    for (const item of items) {
      let pageNum = null;
      try {
        if (item.dest) {
          let dest = item.dest;
          if (typeof dest === 'string') {
            dest = await pdf.getDestination(dest);
          }
          if (Array.isArray(dest) && dest.length > 0) {
            const pageIndex = await pdf.getPageIndex(dest[0]);
            pageNum = pageIndex + 1;
          }
        }
      } catch (err) {
        pageNum = null;
      }
      out.push({
        title: item.title || 'Sans titre',
        page: pageNum,
        depth
      });
      if (item.items && item.items.length > 0) {
        await flattenOutline(pdf, item.items, depth + 1, out);
      }
    }
  }

  function renderOutlineList() {
    clearElement(els.pdfOutlineList);
    if (state.pdfOutline.length === 0) {
      const li = document.createElement('li');
      li.className = 'outline-empty';
      li.textContent = 'Aucun sommaire dans ce PDF';
      els.pdfOutlineList.appendChild(li);
      return;
    }
    for (const entry of state.pdfOutline) {
      const li = document.createElement('li');
      li.style.paddingLeft = `${12 + entry.depth * 14}px`;
      if (entry.page !== null) {
        li.dataset.page = String(entry.page);
      }
      if (entry.page === state.pdfCurrentPage) {
        li.classList.add('active');
      }
      const label = document.createElement('span');
      label.className = 'outline-label';
      label.textContent = entry.title;
      li.appendChild(label);
      if (entry.page !== null) {
        const page = document.createElement('span');
        page.className = 'outline-page';
        page.textContent = entry.page;
        li.appendChild(page);
      }
      if (entry.page !== null) {
        li.addEventListener('click', () => goToPdfPage(entry.page, false));
      }
      els.pdfOutlineList.appendChild(li);
    }
  }

  function highlightOutlineEntry() {
    const items = els.pdfOutlineList.querySelectorAll('li:not(.outline-empty)');
    items.forEach((li) => {
      li.classList.toggle('active', parseInt(li.dataset.page || '0', 10) === state.pdfCurrentPage);
    });
  }

  function currentScaleSync() {
    const pdf = state.pdf;
    if (!pdf) {
      return 1;
    }
    if (state.pdfFitWidth) {
      const available = els.pdfContainer.clientWidth - 32;
      return Math.max(0.1, available / (state.pdfBaseWidth || 1));
    }
    return state.pdfZoomScale || state.appliedScale || 1;
  }

  async function setupPdfPages() {
    const pdf = state.pdf;
    clearElement(els.pdfContainer);
    state.pdfPages = [];
    const firstPage = await pdf.getPage(1);
    state.pdfBaseWidth = firstPage.getViewport({ scale: 1 }).width;
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const base = page.getViewport({ scale: 1 });
      const wrapper = document.createElement('div');
      wrapper.className = 'page-wrap';
      wrapper.dataset.pageNum = String(pageNum);
      els.pdfContainer.appendChild(wrapper);
      state.pdfPages.push({
        pageNum,
        el: wrapper,
        baseWidth: base.width,
        baseHeight: base.height,
        canvas: null,
        renderedScale: null,
        rendering: false
      });
    }
    await applyScale(currentScaleSync(), { keepPage: false });
  }

  async function applyScale(scale, { keepPage = true } = {}) {
    const pages = state.pdfPages;
    const container = els.pdfContainer;
    const prevRec = pages[state.pdfCurrentPage - 1];
    let ratio = 0;
    if (keepPage && prevRec && prevRec.el.offsetHeight > 0) {
      ratio = (container.scrollTop - prevRec.el.offsetTop) / prevRec.el.offsetHeight;
    }
    for (const rec of pages) {
      rec.el.style.width = `${Math.floor(rec.baseWidth * scale)}px`;
      rec.el.style.height = `${Math.floor(rec.baseHeight * scale)}px`;
      if (rec.canvas && rec.renderedScale !== scale) {
        rec.canvas.remove();
        rec.canvas = null;
      }
    }
    state.appliedScale = scale;
    updateZoomLabel(scale);
    await renderVisiblePages();
    if (keepPage && prevRec) {
      const clamped = Math.min(1, Math.max(0, ratio));
      container.scrollTop = prevRec.el.offsetTop + prevRec.el.offsetHeight * clamped;
    }
  }

  function computeVisibleRange() {
    const container = els.pdfContainer;
    const top = container.scrollTop;
    const bottom = top + container.clientHeight;
    let first = null;
    let last = null;
    for (const rec of state.pdfPages) {
      const recTop = rec.el.offsetTop;
      const recBottom = recTop + rec.el.offsetHeight;
      if (recBottom >= top && recTop <= bottom) {
        if (first === null) {
          first = rec.pageNum;
        }
        last = rec.pageNum;
      }
    }
    if (first === null) {
      return { first: 1, last: 1 };
    }
    return { first, last };
  }

  async function renderVisiblePages() {
    const pdf = state.pdf;
    if (!pdf || state.pdfPages.length === 0) {
      return;
    }
    const scale = state.appliedScale;
    if (!scale) {
      return;
    }
    const range = computeVisibleRange();
    const first = Math.max(1, range.first - 1);
    const last = Math.min(pdf.numPages, range.last + 1);
    for (const rec of state.pdfPages) {
      if (rec.canvas && (rec.pageNum < first - 2 || rec.pageNum > last + 2)) {
        rec.canvas.remove();
        rec.canvas = null;
      }
    }
    for (let pageNum = first; pageNum <= last; pageNum++) {
      await renderPage(pageNum, scale);
    }
  }

  async function renderPage(pageNum, scale) {
    const rec = state.pdfPages[pageNum - 1];
    if (!rec || rec.rendering || (rec.canvas && rec.renderedScale === scale)) {
      return;
    }
    rec.rendering = true;
    try {
      const page = await state.pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.className = 'pdf-page-canvas';
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      rec.el.appendChild(canvas);
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      rec.canvas = canvas;
      rec.renderedScale = scale;
    } finally {
      rec.rendering = false;
    }
  }

  function updateZoomLabel(scale) {
    els.pdfZoomValue.textContent = `${Math.round(scale * 100)} %`;
  }

  function goToPdfPage(pageNum, fromInput = false) {
    const pdf = state.pdf;
    if (!pdf) {
      return;
    }
    const target = Math.min(Math.max(1, pageNum), pdf.numPages);
    state.pdfCurrentPage = target;
    if (!fromInput) {
      els.pdfPageInput.value = String(target);
    }
    els.pdfPageTotal.textContent = `/ ${pdf.numPages}`;
    const rec = state.pdfPages[target - 1];
    if (rec) {
      els.pdfContainer.scrollTop = rec.el.offsetTop - 8;
    }
    highlightOutlineEntry();
    renderVisiblePages();
  }

  function updateVisiblePdfPage() {
    const container = els.pdfContainer;
    const center = container.scrollTop + container.clientHeight / 3;
    const wraps = container.querySelectorAll('.page-wrap');
    for (const wrap of wraps) {
      const top = wrap.offsetTop;
      const bottom = top + wrap.offsetHeight;
      if (center >= top && center < bottom) {
        const pageNum = parseInt(wrap.dataset.pageNum || '1', 10);
        if (pageNum !== state.pdfCurrentPage) {
          state.pdfCurrentPage = pageNum;
          els.pdfPageInput.value = String(pageNum);
          highlightOutlineEntry();
        }
        return;
      }
    }
  }

  /* ---------- Notions view ---------- */

  function buildNotionCard(notion, macros) {
    const card = document.createElement('div');
    card.className = 'notion';
    card.id = `notion-${notion.id}`;

    const header = document.createElement('div');
    header.className = 'notion-header';
    const env = document.createElement('span');
    env.className = 'notion-env';
    env.textContent = notion.environment;
    const title = document.createElement('span');
    title.className = 'notion-title';
    title.textContent = notion.title;
    const source = document.createElement('span');
    source.className = 'notion-source';
    source.textContent = notion.course || '';
    header.appendChild(env);
    header.appendChild(title);
    header.appendChild(source);
    card.appendChild(header);

    const body = renderLatexBody(notion.body, macros);
    card.appendChild(body);

    const sourceCode = document.createElement('pre');
    sourceCode.className = 'notion-source-code';
    sourceCode.textContent = notionToLatex(notion);
    card.appendChild(sourceCode);

    return card;
  }

  function renderNotions() {
    clearElement(els.notionsContent);
    const filter = els.notionsSearch.value.trim().toLowerCase();
    const notions = state.notions.filter((n) => {
      if (!filter) {
        return true;
      }
      return (
        n.title.toLowerCase().includes(filter) ||
        n.environment.toLowerCase().includes(filter) ||
        (n.course || '').toLowerCase().includes(filter) ||
        (n.body || '').toLowerCase().includes(filter)
      );
    });
    if (notions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'notions-empty';
      empty.textContent = state.notions.length === 0
        ? 'Aucune notion détectée. Vérifiez vos environnements \\begin{...}{Titre}.'
        : 'Aucune notion ne correspond à la recherche.';
      els.notionsContent.appendChild(empty);
      return;
    }
    const macros = buildKatexMacros(state.scan && state.scan.settings ? state.scan.settings.macros : []);
    for (const notion of notions) {
      els.notionsContent.appendChild(buildNotionCard(notion, macros));
    }
  }

  async function copyNotionsLatex() {
    const filter = els.notionsSearch.value.trim().toLowerCase();
    const notions = state.notions.filter((n) => {
      if (!filter) {
        return true;
      }
      return n.title.toLowerCase().includes(filter);
    });
    const latex = notions.map(notionToLatex).join('\n\n');
    try {
      await navigator.clipboard.writeText(latex);
      els.copyLatexBtn.textContent = '✓ Copié !';
      setTimeout(() => {
        els.copyLatexBtn.textContent = 'Copier le code LaTeX';
      }, 1500);
    } catch (err) {
      alert('Copie impossible : ' + err.message);
    }
  }

  function toggleSource() {
    state.showingSource = !state.showingSource;
    els.notionsContent.classList.toggle('notions-showing-source', state.showingSource);
    els.toggleSourceBtn.textContent = state.showingSource ? 'Masquer le code' : 'Code source';
  }

  /* ---------- Events ---------- */

  els.openFolderBtn.addEventListener('click', openFolderDialog);
  els.rescanBtn.addEventListener('click', rescan);
  for (const btn of els.activityIcons) {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  }

  els.pdfFirst.addEventListener('click', () => goToPdfPage(1));
  els.pdfPrev.addEventListener('click', () => goToPdfPage(state.pdfCurrentPage - 1));
  els.pdfNext.addEventListener('click', () => goToPdfPage(state.pdfCurrentPage + 1));
  els.pdfLast.addEventListener('click', () => goToPdfPage(state.pdf ? state.pdf.numPages : 1));
  els.pdfPageInput.addEventListener('change', () => {
    const value = parseInt(els.pdfPageInput.value, 10);
    if (!isNaN(value)) {
      goToPdfPage(value, true);
    }
  });
  els.pdfPageInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      els.pdfPageInput.blur();
    }
  });

  els.pdfZoomIn.addEventListener('click', () => {
    state.pdfFitWidth = false;
    els.pdfFitWidth.classList.remove('toggled');
    state.pdfZoomScale = Math.min(4, (state.pdfZoomScale || state.appliedScale || 1) * 1.2);
    applyScale(state.pdfZoomScale);
  });
  els.pdfZoomOut.addEventListener('click', () => {
    state.pdfFitWidth = false;
    els.pdfFitWidth.classList.remove('toggled');
    state.pdfZoomScale = Math.max(0.2, (state.pdfZoomScale || state.appliedScale || 1) / 1.2);
    applyScale(state.pdfZoomScale);
  });
  els.pdfFitWidth.addEventListener('click', () => {
    state.pdfFitWidth = !state.pdfFitWidth;
    els.pdfFitWidth.classList.toggle('toggled', state.pdfFitWidth);
    if (state.pdfFitWidth) {
      state.pdfZoomScale = null;
    }
    applyScale(state.pdfFitWidth ? currentScaleSync() : state.pdfZoomScale);
  });

  els.pdfToggleOutline.addEventListener('click', () => {
    const visible = !els.pdfOutlinePanel.classList.contains('hidden');
    show(els.pdfOutlinePanel, !visible);
    els.pdfToggleOutline.classList.toggle('toggled', !visible);
  });

  els.pdfContainer.addEventListener('scroll', () => {
    if (state.pdfScrollTimer) {
      clearTimeout(state.pdfScrollTimer);
    }
    state.pdfScrollTimer = setTimeout(() => {
      updateVisiblePdfPage();
      renderVisiblePages();
    }, 120);
  });

  let notionsSearchTimer = null;
  els.notionsSearch.addEventListener('input', () => {
    state.notionsDirty = true;
    if (state.section !== 'notions') {
      return;
    }
    if (notionsSearchTimer) {
      clearTimeout(notionsSearchTimer);
    }
    notionsSearchTimer = setTimeout(() => {
      renderNotions();
      state.notionsDirty = false;
    }, 150);
  });
  els.copyLatexBtn.addEventListener('click', copyNotionsLatex);
  els.toggleSourceBtn.addEventListener('click', toggleSource);

  window.addEventListener('resize', () => {
    if (!state.pdf || state.section !== 'cours') {
      return;
    }
    if (state.pdfResizeTimer) {
      clearTimeout(state.pdfResizeTimer);
    }
    state.pdfResizeTimer = setTimeout(() => {
      if (state.pdfFitWidth) {
        applyScale(currentScaleSync());
      } else {
        renderVisiblePages();
      }
    }, 200);
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
