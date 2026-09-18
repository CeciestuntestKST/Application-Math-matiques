'use strict';

(function () {
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
    pdfFrame: document.getElementById('pdf-frame'),
    pdfError: document.getElementById('pdf-error'),
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

  function getSettingsMacros() {
    return buildKatexMacros(state.scan && state.scan.settings ? state.scan.settings.macros : []);
  }

  function renderLatexText(text, macros) {
    if (!text) {
      return '';
    }
    const inlineRe = /\$([^$\n]+)\$/g;
    let html = '';
    let lastIndex = 0;
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

  function renderLatexBody(body, macros) {
    const container = document.createElement('div');
    container.className = 'notion-body';
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
    let dm;
    while ((dm = displayRe.exec(body)) !== null) {
      html += renderInline(body.slice(lastIndex, dm.index));
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
    html += renderInline(body.slice(lastIndex));
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

  /* ---------- PDF viewer (natif Chromium) ---------- */

  async function openPdf(filePath) {
    state.activePdf = filePath;
    show(els.pdfFrame, true);
    show(els.pdfError, false);
    els.pdfFrame.src = 'about:blank';
    const result = await window.api.getPdfUrl(filePath);
    if (result.error) {
      show(els.pdfFrame, false);
      els.pdfError.textContent = `Impossible d'ouvrir le PDF : ${result.error}`;
      show(els.pdfError, true);
      return;
    }
    els.pdfFrame.src = result.url;
    renderSidebar();
  }

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
