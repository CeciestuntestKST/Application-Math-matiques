'use strict';

(function () {
  if (window.pdfjsLib) {
    const workerUrl = new URL('../vendor/pdfjs/pdf.worker.min.js', document.baseURI).href;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  }

  const els = {
    openFolderBtn: document.getElementById('btn-open-folder'),
    rescanBtn: document.getElementById('btn-rescan'),
    folderDisplay: document.getElementById('folder-display'),
    sections: document.querySelectorAll('.section'),
    coursList: document.getElementById('cours-list'),
    notionsList: document.getElementById('notions-list'),
    emptyState: document.getElementById('empty-state'),
    readerCours: document.getElementById('reader-cours'),
    readerNotions: document.getElementById('reader-notions'),
    pdfToolbar: document.getElementById('pdf-toolbar'),
    pdfContainer: document.getElementById('pdf-container'),
    pdfPrev: document.getElementById('pdf-prev'),
    pdfNext: document.getElementById('pdf-next'),
    pdfPageNum: document.getElementById('pdf-page-num'),
    pdfZoom: document.getElementById('pdf-zoom'),
    pdfZoomValue: document.getElementById('pdf-zoom-value'),
    pdfTitle: document.getElementById('pdf-title'),
    texCourseView: document.getElementById('tex-course-view'),
    notionsToolbar: document.getElementById('notions-toolbar'),
    notionsSearch: document.getElementById('notions-search'),
    notionsContent: document.getElementById('notions-content'),
    copyLatexBtn: document.getElementById('btn-copy-latex'),
    toggleSourceBtn: document.getElementById('btn-toggle-source')
  };

  const state = {
    section: 'cours',
    scan: null,
    activeCourse: null,
    showingSource: false,
    pdf: null,
    pdfCurrentPage: 1,
    pdfZoomScale: 1.0,
    notions: []
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

  function courseNameToTitle(name) {
    return name.replace(/[-_]/g, ' ');
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

  function renderSidebar() {
    clearElement(els.coursList);
    clearElement(els.notionsList);

    if (!state.scan) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = 'Sélectionnez un dossier';
      els.coursList.appendChild(empty);
      const empty2 = document.createElement('div');
      empty2.className = 'list-empty';
      empty2.textContent = '—';
      els.notionsList.appendChild(empty2);
      return;
    }

    const groupPdfs = Array.isArray(state.scan.pdfFiles) ? state.scan.pdfFiles : [];
    const texCourses = Array.isArray(state.scan.courses) ? state.scan.courses : [];

    if (groupPdfs.length === 0 && texCourses.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = 'Aucun PDF ni fichier .tex trouvé';
      els.coursList.appendChild(empty);
    }

    groupPdfs.forEach((filePath) => {
      const name = basename(filePath).replace(/\.pdf$/i, '');
      els.coursList.appendChild(
        buildListItem({
          icon: '📄',
          label: courseNameToTitle(name),
          title: filePath,
          active: state.activeCourse && state.activeCourse.path === filePath,
          onClick: () => openPdf(filePath)
        })
      );
    });

    texCourses.forEach((course) => {
      const filePath = course.path.replace(/\.tex$/i, '.pdf');
      const pdfExists = groupPdfs.some((p) => p.toLowerCase() === filePath.toLowerCase());
      if (pdfExists) {
        return;
      }
      els.coursList.appendChild(
        buildListItem({
          icon: '∑',
          label: courseNameToTitle(course.name),
          title: course.path,
          active: state.activeCourse && state.activeCourse.path === course.path,
          onClick: () => openTexCourse(course)
        })
      );
    });

    const notions = state.notions;
    if (notions.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'list-empty';
      empty.textContent = 'Aucune notion détectée';
      els.notionsList.appendChild(empty);
    } else {
      const grouped = groupNotionsByEnvironment(notions);
      for (const group of grouped) {
        const header = document.createElement('div');
        header.className = 'item';
        header.style.fontWeight = 'bold';
        header.style.cursor = 'default';
        const icon = document.createElement('span');
        icon.className = 'item-icon';
        icon.textContent = 'ᛘ';
        const label = document.createElement('span');
        label.className = 'item-label';
        label.textContent = group.environment;
        header.appendChild(icon);
        header.appendChild(label);
        const count = document.createElement('span');
        count.className = 'item-count';
        count.textContent = group.notions.length;
        header.appendChild(count);
        els.notionsList.appendChild(header);
        for (const notion of group.notions) {
          els.notionsList.appendChild(
            buildListItem({
              icon: '•',
              label: notion.title,
              title: `${notion.course} — ${notion.title}`,
              onClick: () => scrollToNotion(notion)
            })
          );
        }
      }
    }
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
    for (const btn of els.sections) {
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
    state.activeCourse = null;
    state.notions = flattenNotions(result);
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
    state.activeCourse = { type: 'pdf', path: filePath };
    show(els.pdfToolbar, true);
    show(els.pdfContainer, true);
    show(els.texCourseView, false);
    clearElement(els.pdfContainer);
    els.pdfTitle.textContent = basename(filePath);

    const result = await window.api.readPdf(filePath);
    if (result.error) {
      const err = document.createElement('div');
      err.className = 'notions-empty';
      err.textContent = `Impossible de lire le PDF : ${result.error}`;
      els.pdfContainer.appendChild(err);
      return;
    }
    try {
      const pdf = await window.pdfjsLib.getDocument({ data: result.data }).promise;
      state.pdf = pdf;
      state.pdfCurrentPage = 1;
      renderAllPdfPages();
    } catch (err) {
      const errDiv = document.createElement('div');
      errDiv.className = 'notions-empty';
      errDiv.textContent = `Erreur PDF : ${err.message}`;
      els.pdfContainer.appendChild(errDiv);
    }
  }

  function renderAllPdfPages() {
    const pdf = state.pdf;
    if (!pdf) {
      return;
    }
    clearElement(els.pdfContainer);
    const zoom = state.pdfZoomScale;
    const queue = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      queue.push(pageNum);
    }
    els.pdfPageNum.textContent = `${state.pdfCurrentPage} / ${pdf.numPages}`;

    (async function renderNext() {
      while (queue.length > 0) {
        const pageNum = queue.shift();
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: zoom });
        const canvas = document.createElement('canvas');
        canvas.className = 'pdf-page-canvas';
        canvas.dataset.pageNum = String(pageNum);
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        els.pdfContainer.appendChild(canvas);
        const context = canvas.getContext('2d');
        await page.render({
          canvasContext: context,
          viewport
        }).promise;
      }
    })();
  }

  function updateVisiblePdfPage() {
    const container = els.pdfContainer;
    const center = container.scrollTop + container.clientHeight / 2;
    const canvases = container.querySelectorAll('canvas.pdf-page-canvas');
    for (const canvas of canvases) {
      const top = canvas.offsetTop;
      const bottom = top + canvas.offsetHeight;
      if (center >= top && center < bottom) {
        const idx = parseInt(canvas.dataset.pageNum || '1', 10);
        state.pdfCurrentPage = idx;
        els.pdfPageNum.textContent = `${idx} / ${state.pdf ? state.pdf.numPages : 1}`;
        return;
      }
    }
  }

  /* ---------- TeX course viewer ---------- */

  async function openTexCourse(course) {
    state.activeCourse = { type: 'tex', path: course.path };
    show(els.pdfToolbar, false);
    show(els.pdfContainer, false);
    show(els.texCourseView, true);
    clearElement(els.texCourseView);
    const result = await window.api.readTex(course.path);
    const macros = buildKatexMacros(state.scan && state.scan.settings ? state.scan.settings.macros : []);
    if (result.error) {
      els.texCourseView.innerHTML = `<div class="error">Erreur : ${escapeHtml(result.error)}</div>`;
      return;
    }
    const header = document.createElement('h2');
    header.textContent = courseNameToTitle(course.name);
    header.style.margin = '16px 20px';
    els.texCourseView.appendChild(header);
    for (const notion of course.notions) {
      const card = buildNotionCard({
        environment: notion.environment,
        title: notion.title,
        body: notion.body,
        args: notion.args,
        course: course.name,
        id: `course-${course.name}-${notion.index}`
      }, macros);
      els.texCourseView.appendChild(card);
    }
    if (course.notions.length === 0) {
      const info = document.createElement('p');
      info.className = 'notions-empty';
      info.textContent = 'Aucune notion détectée dans ce fichier.';
      els.texCourseView.appendChild(info);
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
  for (const btn of els.sections) {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  }
  els.pdfPrev.addEventListener('click', () => {
    if (!state.pdf) {
      return;
    }
    const target = Math.max(1, state.pdfCurrentPage - 1);
    const canvas = els.pdfContainer.querySelector(`canvas[data-page-num="${target}"]`);
    if (canvas) {
      canvas.scrollIntoView({ block: 'start' });
    }
  });
  els.pdfNext.addEventListener('click', () => {
    if (!state.pdf) {
      return;
    }
    const target = Math.min(state.pdf.numPages, state.pdfCurrentPage + 1);
    const canvas = els.pdfContainer.querySelector(`canvas[data-page-num="${target}"]`);
    if (canvas) {
      canvas.scrollIntoView({ block: 'start' });
    }
  });
  els.pdfContainer.addEventListener('scroll', () => {
    updateVisiblePdfPage();
  });
  els.pdfZoom.addEventListener('input', () => {
    state.pdfZoomScale = parseInt(els.pdfZoom.value, 10) / 100;
    els.pdfZoomValue.textContent = `${els.pdfZoom.value} %`;
    renderAllPdfPages();
  });
  els.notionsSearch.addEventListener('input', renderNotions);
  els.copyLatexBtn.addEventListener('click', copyNotionsLatex);
  els.toggleSourceBtn.addEventListener('click', toggleSource);

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
