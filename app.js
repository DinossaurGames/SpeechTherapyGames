// Terapia da Fala - Core Application Engine (Edição Avançada, Completa & Editável)

class SpeechTherapyApp {
  constructor() {
    // Intercept localStorage.setItem to auto-update lastUpdated timestamp
    const app = this;
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
      if (key.startsWith('custom_') && key !== 'custom_db_last_updated' && !app.isInitializing) {
        originalSetItem.call(localStorage, 'custom_db_last_updated', Date.now().toString());
      }
      originalSetItem.call(localStorage, key, value);
    };

    this.isInitializing = false;
    this.words = [];
    this.categories = [];
    this.caretaActions = [];
    this.scenes = {};
    this.sequences = [];
    this.travaLinguas = [];
    
    this.currentView = 'landing';
    this.stars = 0;
    
    // Repetition history tracking
    this.recentWordsHistory = [];
    this.recentCategories = [];
    this.recentSequencesHistory = [];
    
    // Editing States
    this.editingWordIdx = null;
    this.editingCategoryIdx = null;
    this.editingVerbIdx = null;
    this.editingSceneKey = null;
    this.editingCaretaIdx = null;
    this.editingStoryIdx = null;
    this.editingTravaIdx = null;
    
    // Game Specific States
    this.intrusoState = { targetWord: null, options: [] };
    this.destapaState = { word: null, revealedBlocks: 0 };
    this.roletaState = { spinning: false, currentAngle: 0 };
    this.comboioState = { targetWord: null, currentSyllables: [] };
    this.sopaState = { targetWord: null, targetLetters: [] };
    this.travaState = { spinning: false, currentAngle: 0 };
    
    this.init();
  }

  init() {
    this.initializeLocalStorage();
    this.loadAllData();
    this.loadStars();
    this.switchView('landing');
    this.switchAdminTab('palavras');
    this.setupGlobalEvents();
    this.checkAndSyncServerDatabase();
  }

  // Copy default assets to LocalStorage on very first load to allow complete editing/deletion of everything
  initializeLocalStorage() {
    this.isInitializing = true;
    if (!localStorage.getItem('app_initialised_v2')) {
      localStorage.setItem('custom_words', JSON.stringify(DEFAULT_WORDS));
      localStorage.setItem('custom_caretas', JSON.stringify(DEFAULT_CARETA_ACTIONS));
      localStorage.setItem('custom_scenes', JSON.stringify(DEFAULT_SCENES));
      localStorage.setItem('custom_sequences', JSON.stringify(DEFAULT_SEQUENCES));
      localStorage.setItem('custom_trava_linguas', JSON.stringify(DEFAULT_TRAVA_LINGUAS));
      localStorage.setItem('custom_verbs', JSON.stringify(DEFAULT_VERBS));
      localStorage.setItem('custom_categories', JSON.stringify(DEFAULT_CATEGORIES));
      localStorage.setItem('app_initialised_v2', 'true');
      localStorage.setItem('custom_db_last_updated', '0'); // Default low timestamp
    }
    if (!localStorage.getItem('custom_trava_linguas')) {
      localStorage.setItem('custom_trava_linguas', JSON.stringify(DEFAULT_TRAVA_LINGUAS));
    }
    if (!localStorage.getItem('custom_verbs')) {
      localStorage.setItem('custom_verbs', JSON.stringify(DEFAULT_VERBS));
    }
    if (!localStorage.getItem('custom_categories')) {
      localStorage.setItem('custom_categories', JSON.stringify(DEFAULT_CATEGORIES));
    }
    this.isInitializing = false;
  }

  async checkAndSyncServerDatabase() {
    try {
      const response = await fetch('db.json');
      if (!response.ok) return;
      const data = await response.json();
      
      const serverTime = data.lastUpdated || 0;
      const localTime = parseInt(localStorage.getItem('custom_db_last_updated') || '0');
      
      if (serverTime > localTime) {
        console.log("Sincronização: Detetada base de dados mais recente no servidor (GitHub).");
        this.isInitializing = true; // Temporary bypass key interception
        
        this.words = data.words || [];
        this.caretaActions = data.caretas || [];
        this.scenes = data.scenes || {};
        this.sequences = data.sequences || [];
        this.travaLinguas = data.trava_linguas || [];
        this.verbs = data.verbs || [];
        this.categories = data.categories || [];
        
        localStorage.setItem('custom_words', JSON.stringify(this.words));
        localStorage.setItem('custom_caretas', JSON.stringify(this.caretaActions));
        localStorage.setItem('custom_scenes', JSON.stringify(this.scenes));
        localStorage.setItem('custom_sequences', JSON.stringify(this.sequences));
        localStorage.setItem('custom_trava_linguas', JSON.stringify(this.travaLinguas));
        localStorage.setItem('custom_verbs', JSON.stringify(this.verbs));
        localStorage.setItem('custom_categories', JSON.stringify(this.categories));
        localStorage.setItem('custom_db_last_updated', serverTime.toString());
        localStorage.setItem('app_initialised_v2', 'true');
        
        this.isInitializing = false;
        
        // Refresh views
        this.populateCategoriesDropdown();
        this.renderAdminWordsTable();
        this.renderAdminVerbsTable();
        this.renderAdminCategoriesTable();
        this.renderAdminCaretasTable();
        this.renderAdminSequencesTable();
        this.renderAdminTravaTable();
        
        this.switchView(this.currentView);
        this.showMascotBubble("Dados sincronizados com o servidor! 🔄");
      }
    } catch (e) {
      console.warn("Sincronização automática ignorada:", e);
      this.isInitializing = false;
    }
  }

  // Restore defaults
  restoreDefaultData() {
    if (confirm("Tens a certeza que queres restaurar os dados originais? Isto irá apagar todas as tuas alterações!")) {
      localStorage.removeItem('app_initialised_v2');
      localStorage.removeItem('custom_trava_linguas');
      localStorage.removeItem('custom_verbs');
      localStorage.removeItem('custom_categories');
      localStorage.removeItem('custom_db_last_updated');
      this.initializeLocalStorage();
      this.loadAllData();
      this.switchAdminTab('palavras');
      this.switchView(this.currentView);
      this.showMascotBubble("Dados restaurados com sucesso! 🔄");
    }
  }

  loadAllData() {
    this.words = JSON.parse(localStorage.getItem('custom_words') || '[]');
    this.caretaActions = JSON.parse(localStorage.getItem('custom_caretas') || '[]');
    this.scenes = JSON.parse(localStorage.getItem('custom_scenes') || '{}');
    this.sequences = JSON.parse(localStorage.getItem('custom_sequences') || '[]');
    this.travaLinguas = JSON.parse(localStorage.getItem('custom_trava_linguas') || '[]');
    this.verbs = JSON.parse(localStorage.getItem('custom_verbs') || '[]');
    this.categories = JSON.parse(localStorage.getItem('custom_categories') || '[]');
  }

  loadStars() {
    const savedStars = localStorage.getItem('therapy_stars');
    this.stars = savedStars ? parseInt(savedStars) : 0;
    this.updateStarsUI();
  }

  addStar() {
    this.stars++;
    localStorage.setItem('therapy_stars', this.stars);
    this.updateStarsUI();
    this.showMascotBubble("Ganhaste uma estrela! ⭐");
  }

  updateStarsUI() {
    const countEl = document.getElementById('global-stars');
    if (countEl) countEl.innerText = this.stars;
  }

  resetStars() {
    if (confirm("Queres reiniciar o teu contador de estrelas para zero? ⭐")) {
      this.stars = 0;
      localStorage.setItem('therapy_stars', this.stars);
      this.updateStarsUI();
      this.showMascotBubble("Estrelas reiniciadas! 0 ⭐");
    }
  }

  setupGlobalEvents() {
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('.constructor-canvas-container') || e.target.closest('.monsters-container')) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  showMascotBubble(text, duration = 3000) {
    const bubble = document.getElementById('mascot-bubble');
    if (bubble) {
      bubble.innerText = text;
      bubble.classList.add('show');
      
      if (this.bubbleTimeout) clearTimeout(this.bubbleTimeout);
      this.bubbleTimeout = setTimeout(() => {
        bubble.classList.remove('show');
      }, duration);
    }
  }

  clickMascot() {
    const messages = [
      "Estás a fazer um ótimo trabalho! 👍",
      "Qual é o teu jogo preferido? 🎡",
      "Podes editar e apagar tudo o que quiseres no painel!",
      "Adoro ajudar-te a treinar! 🎈",
      "Continua assim! ⭐"
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    this.showMascotBubble(randomMsg);
  }

  // Admin tab switcher
  switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
    
    const btn = document.getElementById(`tab-btn-${tabName}`);
    const content = document.getElementById(`admin-tab-${tabName}`);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
    
    // Refresh tables
    if (tabName === 'palavras') this.renderAdminWordsTable();
    if (tabName === 'cenarios') {
      this.renderAdminScenesTable();
      this.populateSceneSelects();
    }
    if (tabName === 'caretas') this.renderAdminCaretasTable();
    if (tabName === 'historias') this.renderAdminStoriesTable();
    if (tabName === 'travalinguas') this.renderAdminTravaTable();
    if (tabName === 'verbs') this.renderAdminVerbsTable();
    if (tabName === 'categories') this.renderAdminCategoriesTable();
  }

  // Navigation controller
  switchView(viewName) {
    this.currentView = viewName;
    const viewport = document.getElementById('game-card-container');
    const headerTitle = document.getElementById('current-game-title');
    const headerSubtitle = document.getElementById('current-game-subtitle');
    
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.remove('active');
      const text = btn.innerText.toLowerCase();
      if (viewName === 'landing' && text.includes('início')) btn.classList.add('active');
      else if (viewName === 'intruso' && text.includes('intruso')) btn.classList.add('active');
      else if (viewName === 'destapa' && text.includes('destapa')) btn.classList.add('active');
      else if (viewName === 'constructor' && text.includes('cenários')) btn.classList.add('active');
      else if (viewName === 'roleta' && text.includes('roleta') && !text.includes('trava')) btn.classList.add('active');
      else if (viewName === 'monstros' && text.includes('monstros') && !text.includes('fonemas')) btn.classList.add('active');
      else if (viewName === 'monstros_fonemas' && text.includes('fonemas')) btn.classList.add('active');
      else if (viewName === 'memoria' && text.includes('memória')) btn.classList.add('active');
      else if (viewName === 'detetive' && text.includes('detetive')) btn.classList.add('active');
      else if (viewName === 'comboio' && text.includes('comboio')) btn.classList.add('active');
      else if (viewName === 'sopa' && text.includes('sopa')) btn.classList.add('active');
      else if (viewName === 'trava_linguas' && text.includes('trava-línguas')) btn.classList.add('active');
      else if (viewName === 'flashcards' && text.includes('flashcard')) btn.classList.add('active');
      else if (viewName === 'caca_sons' && text.includes('sons')) btn.classList.add('active');
      else if (viewName === 'construtor_frases' && text.includes('frases')) btn.classList.add('active');
      else if (viewName === 'corrida_carros' && text.includes('corrida')) btn.classList.add('active');
    });

    viewport.className = 'game-card-container';
    
    switch (viewName) {
      case 'landing':
        headerTitle.innerText = "Fala a Brincar";
        headerSubtitle.innerText = "Seleciona uma atividade para realizar com a criança.";
        this.renderLanding(viewport);
        break;
      case 'intruso':
        headerTitle.innerText = "O Intruso das Palavras";
        headerSubtitle.innerText = "Objetivo: Raciocínio lógico, categorização semântica e vocabulário.";
        this.initIntrusoGame(viewport);
        break;
      case 'destapa':
        headerTitle.innerText = "Destapa e Descobre";
        headerSubtitle.innerText = "Objetivo: Vocabulário, nomeação rápida e atenção visual.";
        this.initDestapaGame(viewport);
        break;
      case 'constructor':
        headerTitle.innerText = "O Construtor de Cenários";
        headerSubtitle.innerText = "Objetivo: Expressão oral livre, formação de frases e imaginação.";
        this.initConstructorGame(viewport);
        break;
      case 'roleta':
        headerTitle.innerText = "Roleta de Caretas";
        headerSubtitle.innerText = "Objetivo: Treino de motricidade orofacial, práxias e imitação.";
        this.initRoletaGame(viewport);
        break;
      case 'monstros':
        headerTitle.innerText = "O Alimentador de Monstros";
        headerSubtitle.innerText = "Objetivo: Raciocínio de categorização semântica.";
        this.initMonstrosGame(viewport);
        break;
      case 'monstros_fonemas':
        headerTitle.innerText = "Os Monstros dos Fonemas";
        headerSubtitle.innerText = "Objetivo: Consciência silábica e fonológica (som da letra inicial).";
        this.initMonstrosFonemasGame(viewport);
        break;
      case 'memoria':
        headerTitle.innerText = "Jogo da Memória";
        headerSubtitle.innerText = "Objetivo: Memória de trabalho visual, emparelhamento e foco.";
        this.initMemoriaGame(viewport);
        break;
      case 'detetive':
        headerTitle.innerText = "O Detetive de Histórias";
        headerSubtitle.innerText = "Objetivo: Sequenciação lógica temporal e narrativa verbal.";
        this.initDetetiveGame(viewport);
        break;
      case 'comboio':
        headerTitle.innerText = "O Comboio das Sílabas";
        headerSubtitle.innerText = "Objetivo: Consciência silábica e ordenação de sílabas.";
        this.initComboioGame(viewport);
        break;
      case 'sopa':
        headerTitle.innerText = "A Sopa de Letras";
        headerSubtitle.innerText = "Objetivo: Consciência fonológica, soletração e construção de palavras.";
        this.initSopaGame(viewport);
        break;
      case 'trava_linguas':
        headerTitle.innerText = "Roleta do Trava-Línguas";
        headerSubtitle.innerText = "Objetivo: Agilidade articulatória, fluidez e velocidade na fala.";
        this.initTravaLinguasGame(viewport);
        break;
      case 'flashcards':
        headerTitle.innerText = "Flashcards de Vocabulário";
        headerSubtitle.innerText = "Objetivo: Vocabulário, nomeação e reconhecimento visual de palavras.";
        this.initFlashcardsGame(viewport);
        break;
      case 'caca_sons':
        headerTitle.innerText = "Caça aos Sons";
        headerSubtitle.innerText = "Objetivo: Discriminação fonológica, atenção auditiva e identificação sonora.";
        this.initCacaSonsGame(viewport);
        break;
      case 'construtor_frases':
        headerTitle.innerText = "Construtor de Frases";
        headerSubtitle.innerText = "Objetivo: Estruturação morfossintática, criatividade e expressão oral.";
        this.initConstrutorFrasesGame(viewport);
        break;
      case 'corrida_carros':
        headerTitle.innerText = "Corrida de Carros";
        headerSubtitle.innerText = "Objetivo: Desafios rápidos automatizados para treino cognitivo e fonológico.";
        this.initCorridaCarrosGame(viewport);
        break;
    }
  }

  renderLanding(container) {
    container.innerHTML = `
      <div class="landing-view">
        <div class="dancing-dino">🦖</div>
        <h3 class="landing-title">Olá, pronto para treinar?</h3>
        <p class="landing-desc">
          Esta aplicação foi desenhada especialmente para iPads. Permite realizar exercícios e dinâmicas interativas focadas na fala, articulação, linguagem e memória.
        </p>
        <p style="font-size: 1.25rem; font-weight: 800; color: var(--accent-purple); margin-top: 10px;">
          👈 Escolhe um jogo no menu lateral para começar!
        </p>
      </div>
    `;
    this.showMascotBubble("Olá! Escolhe um jogo para começarmos!");
  }

  // --- JOGO 1: O INTRUSO ---
  initIntrusoGame(container) {
    this.loadIntrusoRound(container);
  }

  loadIntrusoRound(container) {
    const categories = [...new Set(this.words.map(w => w.categoria))];
    
    // Try to find categories with >= 3 words and at least 1 word in other categories
    const validCategories = categories.filter(cat => {
      const sameCount = this.words.filter(w => w.categoria === cat).length;
      const diffCount = this.words.filter(w => w.categoria !== cat).length;
      return sameCount >= 3 && diffCount >= 1;
    });

    let targetCategory = null;
    let chosenSame = [];
    let chosenIntruder = null;

    if (validCategories.length > 0) {
      targetCategory = this.getRandomAvoidingRecentCategory(validCategories);
      const sameCatWords = this.words.filter(w => w.categoria === targetCategory);
      const diffCatWords = this.words.filter(w => w.categoria !== targetCategory);
      
      const shuffledSame = this.shuffleWordsAvoidingRecent(sameCatWords);
      chosenSame = shuffledSame.slice(0, 3);
      chosenIntruder = this.getRandomAvoidingRecent(diffCatWords);
    } else {
      // Fallback: If no single category has 3 words, but we have at least 4 words in total
      if (this.words.length >= 4) {
        const shuffledAll = this.shuffleWordsAvoidingRecent(this.words);
        chosenSame = shuffledAll.slice(0, 3);
        chosenIntruder = shuffledAll[3];
        targetCategory = chosenSame[0].categoria;
      } else {
        container.innerHTML = `<p style="text-align:center; padding: 40px;">Adicione mais palavras no painel administrativo para jogar!</p>`;
        return;
      }
    }

    // Track chosen words in repetition history
    [...chosenSame, chosenIntruder].forEach(w => {
      if (!this.recentWordsHistory.includes(w.palavra)) {
        this.recentWordsHistory.push(w.palavra);
      }
    });
    if (this.recentWordsHistory.length > 12) {
      this.recentWordsHistory = this.recentWordsHistory.slice(-12);
    }

    const options = this.shuffle([...chosenSame, chosenIntruder]);
    
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; flex-grow:1; height:100%;">
        <h4 style="font-size:1.3rem; font-weight:800; color:var(--primary-dark); text-align:center;">
          Qual destas figuras NÃO pertence ao grupo das "${targetCategory}"?
        </h4>
        <div class="intruso-grid">
          ${options.map((word) => `
            <div class="intruso-card" onclick="app.handleIntrusoClick(this, '${word.palavra}', '${chosenIntruder.palavra}')">
              <div class="intruso-card-img-wrapper">
                <img src="${word.imagem}" alt="${word.palavra}" style="${app.getImgStyle(word)}">
              </div>
              <div class="intruso-label">${word.palavra}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    this.showMascotBubble("Descobre o intruso!");
  }

  handleIntrusoClick(cardEl, clickedWord, intruderWord) {
    if (clickedWord === intruderWord) {
      cardEl.classList.add('success');
      this.addStar();
      this.triggerCelebration(() => {
        this.loadIntrusoRound(document.getElementById('game-card-container'));
      });
    } else {
      cardEl.classList.add('shake');
      this.showMascotBubble("Esse pertence ao grupo!");
      setTimeout(() => cardEl.classList.remove('shake'), 600);
    }
  }

  // --- JOGO 2: DESTAPA E DESCOBRE ---
  initDestapaGame(container) {
    if (this.words.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding: 40px;">Sem palavras disponíveis.</p>`;
      return;
    }
    const randWord = this.getRandomAvoidingRecent(this.words);
    this.destapaState.word = randWord;
    
    container.innerHTML = `
      <div class="destapa-container">
        <h4 style="font-size:1.3rem; font-weight:800; color:var(--primary-dark);">Descobre o que está escondido!</h4>
        <div class="destapa-board">
          <img class="destapa-target-image" src="${randWord.imagem}" alt="Segredo" style="${app.getImgStyle(randWord)}">
          <div class="destapa-grid">
            <div class="destapa-block" onclick="app.handleDestapaClick(this)">1</div>
            <div class="destapa-block" onclick="app.handleDestapaClick(this)">2</div>
            <div class="destapa-block" onclick="app.handleDestapaClick(this)">3</div>
            <div class="destapa-block" onclick="app.handleDestapaClick(this)">4</div>
            <div class="destapa-block" onclick="app.handleDestapaClick(this)">5</div>
            <div class="destapa-block" onclick="app.handleDestapaClick(this)">6</div>
            <div class="destapa-block" onclick="app.handleDestapaClick(this)">7</div>
            <div class="destapa-block" onclick="app.handleDestapaClick(this)">8</div>
            <div class="destapa-block" onclick="app.handleDestapaClick(this)">9</div>
          </div>
        </div>
        <div class="destapa-controls">
          <button class="btn-action btn-secondary" onclick="app.revealDestapaAll()">👁️ Revelar Tudo</button>
          <button class="btn-action" onclick="app.nextDestapaWord()">Próxima Palavra ➔</button>
        </div>
        <div id="destapa-result" style="font-size:1.6rem; font-weight:800; text-transform:uppercase; color:var(--primary); opacity:0; transition:opacity 0.3s;">
          É um(a) ${randWord.palavra}!
        </div>
      </div>
    `;
    this.showMascotBubble("Toca nos números para revelar!");
  }

  handleDestapaClick(blockEl) {
    blockEl.classList.add('hidden');
  }

  revealDestapaAll() {
    document.querySelectorAll('.destapa-block').forEach(block => block.classList.add('hidden'));
    const resultEl = document.getElementById('destapa-result');
    resultEl.style.opacity = '1';
    this.addStar();
  }

  nextDestapaWord() {
    this.initDestapaGame(document.getElementById('game-card-container'));
  }

  // --- JOGO 3: CONSTRUTOR DE CENÁRIOS ---
  initConstructorGame(container) {
    const sceneKeys = Object.keys(this.scenes);
    if (sceneKeys.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding: 40px;">Crie cenários no Painel Administrativo.</p>`;
      return;
    }
    this.renderConstructorLayout(container, sceneKeys[0]);
  }

  renderConstructorLayout(container, sceneKey) {
    const scene = this.scenes[sceneKey];
    
    container.innerHTML = `
      <div class="constructor-header">
        <div class="scene-picker">
          ${Object.keys(this.scenes).map(key => `
            <button class="scene-btn ${sceneKey === key ? 'active' : ''}" onclick="app.renderConstructorLayout(document.getElementById('game-card-container'), '${key}')">
              ${this.scenes[key].nome}
            </button>
          `).join('')}
        </div>
        <button class="btn-action btn-secondary" onclick="app.clearConstructorCanvas()">Limpar Cenário</button>
      </div>
      <div class="constructor-layout">
        <div class="constructor-toolbox">
          <div class="toolbox-title">Elementos</div>
          <div class="toolbox-items">
            ${scene.elementos.map(item => `
              <div class="draggable-item" data-img="${item.img}" data-name="${item.nome}" onmousedown="app.dragStart(event, this)" ontouchstart="app.dragStart(event, this)">
                <img src="${item.img}" alt="${item.nome}">
                <div class="draggable-item-name">${item.nome}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div id="constructor-canvas" class="constructor-canvas-container" style="background-image: url('${scene.fundo}');">
          <!-- Elements drops -->
        </div>
      </div>
    `;
    this.showMascotBubble(`Vamos brincar no cenário: ${scene.nome}`);
  }

  clearConstructorCanvas() {
    const canvas = document.getElementById('constructor-canvas');
    if (canvas) canvas.innerHTML = '';
  }

  dragStart(event, element) {
    event.preventDefault();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    const ghost = document.createElement('div');
    ghost.className = 'canvas-dropped-item';
    ghost.style.position = 'fixed';
    ghost.style.left = `${clientX - 45}px`;
    ghost.style.top = `${clientY - 45}px`;
    ghost.style.width = '90px';
    ghost.style.height = '90px';
    ghost.style.zIndex = '1000';
    ghost.style.pointerEvents = 'none';
    
    const img = document.createElement('img');
    img.src = element.getAttribute('data-img');
    ghost.appendChild(img);
    document.body.appendChild(ghost);
    
    const name = element.getAttribute('data-name');
    
    const onMove = (moveEvent) => {
      const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      ghost.style.left = `${curX - 45}px`;
      ghost.style.top = `${curY - 45}px`;
    };
    
    const onEnd = (endEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      
      const rect = document.getElementById('constructor-canvas').getBoundingClientRect();
      const endX = endEvent.changedTouches ? endEvent.changedTouches[0].clientX : endEvent.clientX;
      const endY = endEvent.changedTouches ? endEvent.changedTouches[0].clientY : endEvent.clientY;
      
      if (endX >= rect.left && endX <= rect.right && endY >= rect.top && endY <= rect.bottom) {
        const localX = endX - rect.left - 45;
        const localY = endY - rect.top - 45;
        this.addDroppedItemToCanvas(element.getAttribute('data-img'), localX, localY, name);
        this.addStar();
      }
      document.body.removeChild(ghost);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  addDroppedItemToCanvas(imgSrc, x, y, name) {
    const canvas = document.getElementById('constructor-canvas');
    const itemEl = document.createElement('div');
    itemEl.className = 'canvas-dropped-item';
    itemEl.style.left = `${x}px`;
    itemEl.style.top = `${y}px`;
    
    itemEl.onmousedown = (e) => this.dragExistingStart(e, itemEl);
    itemEl.ontouchstart = (e) => this.dragExistingStart(e, itemEl);
    
    itemEl.innerHTML = `
      <img src="${imgSrc}" alt="${name}">
      <button class="delete-btn" onclick="event.stopPropagation(); this.parentElement.remove();">×</button>
    `;
    canvas.appendChild(itemEl);
  }

  dragExistingStart(event, element) {
    event.stopPropagation();
    event.preventDefault();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    const rect = document.getElementById('constructor-canvas').getBoundingClientRect();
    const offsetX = clientX - element.getBoundingClientRect().left;
    const offsetY = clientY - element.getBoundingClientRect().top;
    
    const onMove = (moveEvent) => {
      const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      let localX = curX - rect.left - offsetX;
      let localY = curY - rect.top - offsetY;
      
      localX = Math.max(0, Math.min(localX, rect.width - 90));
      localY = Math.max(0, Math.min(localY, rect.height - 90));
      
      element.style.left = `${localX}px`;
      element.style.top = `${localY}px`;
    };
    
    const onEnd = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  // --- JOGO 4: ROLETA DE CARETAS ---
  initRoletaGame(container) {
    container.innerHTML = `
      <div class="roleta-container">
        <!-- Left Side: Wheel -->
        <div class="roleta-left-side">
          <div class="roleta-wrapper">
            <div class="roleta-marker"></div>
            <div id="roleta-wheel" class="roleta-wheel"></div>
            <div class="roleta-center">RODA!</div>
          </div>
        </div>
        
        <!-- Right Side: Content -->
        <div class="roleta-right-side">
          <h4 class="roleta-instruction-title">
            Roda para descobrir a careta ou som que deves imitar!
          </h4>
          <button id="spin-btn" class="btn-action" onclick="app.spinRoleta()">Girar Roleta 🎡</button>
          <div id="roleta-result" class="roleta-result-panel" style="opacity: 0;">
            <div id="roleta-emoji" class="roleta-result-emoji">😮</div>
            <div id="roleta-text" class="roleta-result-text">Clica em Girar!</div>
            <button id="roleta-start-timer-btn" class="btn-action" style="margin-top: 15px; background:var(--accent-pink); color:white;" onclick="app.startRoletaTimer()">Começar Careta ⏱️</button>
            <div id="roleta-countdown" style="font-size: 1.3rem; font-weight:800; color: var(--accent-pink); margin-top: 12px; display: none;"></div>
          </div>
        </div>
      </div>
    `;
    
    this.renderRoletaLabels();
    this.showMascotBubble("Gira a roleta!");
  }

  renderRoletaLabels() {
    const wheel = document.getElementById('roleta-wheel');
    if (!wheel || this.caretaActions.length === 0) return;
    
    // Always 8 color sectors
    const length = 8;
    const colors = ['#FF7B93', '#4BA3FF', '#2AD1A3', '#FFD026', '#9D7BFF', '#FF8C32', '#00D2C4', '#FF4D4D'];
    let gradientParts = [];
    const percentPerSlice = 100 / length;
    for (let i = 0; i < length; i++) {
      const color = colors[i % colors.length];
      gradientParts.push(`${color} ${i * percentPerSlice}% ${(i + 1) * percentPerSlice}%`);
    }
    wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;
    
    // Render dividing spoke lines (4 lines crossing center = 8 sectors)
    wheel.innerHTML = `
      <div class="wheel-spoke" style="transform: rotate(0deg);"></div>
      <div class="wheel-spoke" style="transform: rotate(45deg);"></div>
      <div class="wheel-spoke" style="transform: rotate(90deg);"></div>
      <div class="wheel-spoke" style="transform: rotate(135deg);"></div>
    `;
  }

  spinRoleta() {
    let actions = [...this.caretaActions];
    if (this.roletaState.spinning || actions.length === 0) return;
    this.roletaState.spinning = true;
    
    // Fill up to exactly 8 items (repeat if necessary)
    while (actions.length < 8) {
      actions = actions.concat(this.caretaActions);
    }
    actions = actions.slice(0, 8);
    
    const wheel = document.getElementById('roleta-wheel');
    const resultPanel = document.getElementById('roleta-result');
    const spinBtn = document.getElementById('spin-btn');
    const countdownEl = document.getElementById('roleta-countdown');
    const startTimerBtn = document.getElementById('roleta-start-timer-btn');
    
    resultPanel.style.opacity = '0';
    if (countdownEl) {
      countdownEl.style.display = 'none';
      countdownEl.innerText = '';
    }
    if (startTimerBtn) {
      startTimerBtn.style.display = 'block';
    }
    spinBtn.disabled = true;
    
    this.showMascotBubble("A girar...");
    
    const targetIdx = Math.floor(Math.random() * 8);
    const sliceAngle = 360 / 8;
    // Align targetIdx center with the top pointer (0 deg).
    const newAngle = this.roletaState.currentAngle + 1800 + (360 - (targetIdx * sliceAngle) - (sliceAngle / 2));
    this.roletaState.currentAngle = newAngle;
    
    wheel.style.transform = `rotate(${newAngle}deg)`;
    
    setTimeout(() => {
      this.roletaState.spinning = false;
      spinBtn.disabled = false;
      
      const action = actions[targetIdx];
      document.getElementById('roleta-emoji').innerText = action.emoji;
      document.getElementById('roleta-text').innerText = action.texto;
      resultPanel.style.opacity = '1';
      this.showMascotBubble("Preparado(a)? Clica no botão para iniciar o tempo!");
    }, 4100);
  }

  startRoletaTimer() {
    const startTimerBtn = document.getElementById('roleta-start-timer-btn');
    const countdownEl = document.getElementById('roleta-countdown');
    const spinBtn = document.getElementById('spin-btn');
    
    if (startTimerBtn) startTimerBtn.style.display = 'none';
    if (countdownEl) {
      countdownEl.style.display = 'block';
      
      let timeLeft = 5;
      countdownEl.innerText = `Mantém a careta por: ${timeLeft}s`;
      spinBtn.disabled = true; // prevent spinning during countdown
      
      const timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
          clearInterval(timer);
          countdownEl.innerText = `Muito bem! 🎉`;
          spinBtn.disabled = false;
          this.addStar();
          this.showMascotBubble("Boa! Ganhaste uma estrela! ⭐");
        } else {
          countdownEl.innerText = `Mantém a careta por: ${timeLeft}s`;
        }
      }, 1000);
    }
  }

  // --- JOGO 5: ALIMENTADOR DE MONSTROS ---
  getMonsterSVG(monsterId) {
    const svgs = {
      'monster-green': `
        <svg class="monster-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect x="15" y="20" width="70" height="70" rx="35" fill="var(--accent-mint)" stroke="#2C2643" stroke-width="4"/>
          <circle cx="35" cy="42" r="9" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="35" cy="42" r="4.5" fill="#2C2643"/>
          <circle cx="33" cy="40" r="1.5" fill="white"/>
          <circle cx="65" cy="42" r="9" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="65" cy="42" r="4.5" fill="#2C2643"/>
          <circle cx="63" cy="40" r="1.5" fill="white"/>
          <circle cx="23" cy="55" r="5" fill="#FFB2B2"/>
          <circle cx="77" cy="55" r="5" fill="#FFB2B2"/>
          <path d="M 30 20 Q 25 5 18 10" fill="none" stroke="#2C2643" stroke-width="4" stroke-linecap="round"/>
          <circle cx="18" cy="10" r="4" fill="var(--accent-yellow)" stroke="#2C2643" stroke-width="2"/>
          <path d="M 70 20 Q 75 5 82 10" fill="none" stroke="#2C2643" stroke-width="4" stroke-linecap="round"/>
          <circle cx="82" cy="10" r="4" fill="var(--accent-yellow)" stroke="#2C2643" stroke-width="2"/>
          <g class="monster-jaw" style="transition: transform 0.2s;">
            <rect x="32" y="58" width="36" height="15" rx="7.5" fill="#2C2643" stroke="#2C2643" stroke-width="2"/>
            <polygon points="38,58 42,63 46,58" fill="white"/>
            <polygon points="54,58 58,63 62,58" fill="white"/>
          </g>
        </svg>
      `,
      'monster-pink': `
        <svg class="monster-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="22" r="12" fill="var(--accent-pink)" stroke="#2C2643" stroke-width="4"/>
          <circle cx="25" cy="22" r="6" fill="#FFA3C2"/>
          <circle cx="75" cy="22" r="12" fill="var(--accent-pink)" stroke="#2C2643" stroke-width="4"/>
          <circle cx="75" cy="22" r="6" fill="#FFA3C2"/>
          <rect x="15" y="24" width="70" height="66" rx="25" fill="var(--accent-pink)" stroke="#2C2643" stroke-width="4"/>
          <circle cx="35" cy="46" r="10" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="35" cy="46" r="5" fill="#2C2643"/>
          <circle cx="33" cy="44" r="2" fill="white"/>
          <circle cx="37" cy="48" r="0.8" fill="white"/>
          <circle cx="65" cy="46" r="10" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="65" cy="46" r="5" fill="#2C2643"/>
          <circle cx="63" cy="44" r="2" fill="white"/>
          <circle cx="67" cy="48" r="0.8" fill="white"/>
          <circle cx="24" cy="58" r="6" fill="#FF85B3" opacity="0.6"/>
          <circle cx="76" cy="58" r="6" fill="#FF85B3" opacity="0.6"/>
          <g class="monster-jaw" style="transition: transform 0.2s;">
            <rect x="30" y="60" width="40" height="15" rx="7.5" fill="#2C2643" stroke="#2C2643" stroke-width="2"/>
            <ellipse cx="50" cy="67" rx="6" ry="4" fill="#FF85B3"/>
          </g>
        </svg>
      `,
      'monster-yellow': `
        <svg class="monster-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <polygon points="15,30 22,5 38,25" fill="var(--accent-yellow)" stroke="#2C2643" stroke-width="4" stroke-linejoin="round"/>
          <polygon points="19,26 24,10 34,22" fill="#FFE28A"/>
          <polygon points="85,30 78,5 62,25" fill="var(--accent-yellow)" stroke="#2C2643" stroke-width="4" stroke-linejoin="round"/>
          <polygon points="81,26 76,10 66,22" fill="#FFE28A"/>
          <rect x="15" y="24" width="70" height="66" rx="28" fill="var(--accent-yellow)" stroke="#2C2643" stroke-width="4"/>
          <circle cx="32" cy="45" r="7.5" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="32" cy="45" r="3.5" fill="#2C2643"/>
          <circle cx="30" cy="43" r="1.2" fill="white"/>
          <circle cx="50" cy="40" r="10" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="50" cy="40" r="5" fill="#2C2643"/>
          <circle cx="48" cy="38" r="2" fill="white"/>
          <circle cx="68" cy="45" r="7.5" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="68" cy="45" r="3.5" fill="#2C2643"/>
          <circle cx="66" cy="43" r="1.2" fill="white"/>
          <circle cx="24" cy="57" r="5" fill="#FFC04D" opacity="0.6"/>
          <circle cx="76" cy="57" r="5" fill="#FFC04D" opacity="0.6"/>
          <polygon points="48,51 52,51 50,53" fill="#2C2643"/>
          <g class="monster-jaw" style="transition: transform 0.2s;">
            <rect x="32" y="60" width="36" height="15" rx="7.5" fill="#2C2643" stroke="#2C2643" stroke-width="2"/>
            <polygon points="46,60 50,64 54,60" fill="white"/>
          </g>
        </svg>
      `,
      'monster-blue': `
        <svg class="monster-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M 16 35 Q 3 20 6 30 Q 12 38 20 38" fill="var(--accent-yellow)" stroke="#2C2643" stroke-width="3"/>
          <path d="M 84 35 Q 97 20 94 30 Q 88 38 80 38" fill="var(--accent-yellow)" stroke="#2C2643" stroke-width="3"/>
          <rect x="15" y="22" width="70" height="68" rx="25" fill="var(--accent-blue)" stroke="#2C2643" stroke-width="4"/>
          <circle cx="35" cy="44" r="9.5" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="35" cy="44" r="4.5" fill="#2C2643"/>
          <circle cx="33" cy="42" r="1.8" fill="white"/>
          <circle cx="65" cy="44" r="9.5" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="65" cy="44" r="4.5" fill="#2C2643"/>
          <circle cx="63" cy="42" r="1.8" fill="white"/>
          <circle cx="24" cy="56" r="5.5" fill="#99C2FF" opacity="0.8"/>
          <circle cx="76" cy="56" r="5.5" fill="#99C2FF" opacity="0.8"/>
          <g class="monster-jaw" style="transition: transform 0.2s;">
            <rect x="26" y="58" width="48" height="16" rx="8" fill="#2C2643" stroke="#2C2643" stroke-width="2"/>
            <polygon points="34,58 38,64 42,58" fill="white"/>
            <polygon points="58,58 62,64 66,58" fill="white"/>
          </g>
        </svg>
      `,
      'monster-purple': `
        <svg class="monster-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <path d="M 50 20 Q 50 4 44 8" fill="none" stroke="#2C2643" stroke-width="4" stroke-linecap="round"/>
          <path d="M 40 22 Q 33 6 41 10" fill="none" stroke="#2C2643" stroke-width="4" stroke-linecap="round"/>
          <path d="M 60 22 Q 67 6 59 10" fill="none" stroke="#2C2643" stroke-width="4" stroke-linecap="round"/>
          <rect x="15" y="22" width="70" height="68" rx="34" fill="var(--accent-purple)" stroke="#2C2643" stroke-width="4"/>
          <circle cx="50" cy="44" r="15" fill="white" stroke="#2C2643" stroke-width="3.5"/>
          <circle cx="50" cy="44" r="7" fill="#2C2643"/>
          <circle cx="47" cy="41" r="2.5" fill="white"/>
          <circle cx="52" cy="46" r="1" fill="white"/>
          <circle cx="26" cy="58" r="5.5" fill="#E0B0FF" opacity="0.6"/>
          <circle cx="74" cy="58" r="5.5" fill="#E0B0FF" opacity="0.6"/>
          <g class="monster-jaw" style="transition: transform 0.2s;">
            <rect x="32" y="60" width="36" height="15" rx="7.5" fill="#2C2643" stroke="#2C2643" stroke-width="2"/>
            <rect x="44" y="60" width="12" height="6" rx="2" fill="white"/>
          </g>
        </svg>
      `,
      'monster-orange': `
        <svg class="monster-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="45" width="8" height="10" rx="3" fill="#D3D3D3" stroke="#2C2643" stroke-width="3"/>
          <rect x="84" y="45" width="8" height="10" rx="3" fill="#D3D3D3" stroke="#2C2643" stroke-width="3"/>
          <rect x="15" y="20" width="70" height="70" rx="18" fill="#FF8C32" stroke="#2C2643" stroke-width="4"/>
          <circle cx="34" cy="42" r="8" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="34" cy="42" r="3.5" fill="#2C2643"/>
          <circle cx="32" cy="40" r="1.5" fill="white"/>
          <circle cx="66" cy="42" r="8" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="66" cy="42" r="3.5" fill="#2C2643"/>
          <circle cx="64" cy="40" r="1.5" fill="white"/>
          <circle cx="24" cy="54" r="5" fill="var(--accent-pink)" opacity="0.7"/>
          <circle cx="76" cy="54" r="5" fill="var(--accent-pink)" opacity="0.7"/>
          <g class="monster-jaw" style="transition: transform 0.2s;">
            <rect x="26" y="60" width="48" height="15" rx="7.5" fill="#2C2643" stroke="#2C2643" stroke-width="2"/>
            <rect x="36" y="60" width="8" height="5" fill="white"/>
            <rect x="56" y="60" width="8" height="5" fill="white"/>
          </g>
        </svg>
      `,
      'monster-cyan': `
        <svg class="monster-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <polygon points="20,22 10,8 32,15" fill="var(--accent-yellow)" stroke="#2C2643" stroke-width="3.5" stroke-linejoin="round"/>
          <polygon points="80,22 90,8 68,15" fill="var(--accent-yellow)" stroke="#2C2643" stroke-width="3.5" stroke-linejoin="round"/>
          <rect x="15" y="22" width="70" height="68" rx="26" fill="#00D2C4" stroke="#2C2643" stroke-width="4"/>
          <circle cx="34" cy="44" r="8.5" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="34" cy="44" r="4" fill="#2C2643"/>
          <circle cx="32" cy="42" r="1.5" fill="white"/>
          <circle cx="66" cy="44" r="8.5" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="66" cy="44" r="4" fill="#2C2643"/>
          <circle cx="64" cy="42" r="1.5" fill="white"/>
          <circle cx="23" cy="56" r="5" fill="#80FFF6" opacity="0.6"/>
          <circle cx="77" cy="56" r="5" fill="#80FFF6" opacity="0.6"/>
          <g class="monster-jaw" style="transition: transform 0.2s;">
            <rect x="28" y="60" width="44" height="15" rx="7.5" fill="#2C2643" stroke="#2C2643" stroke-width="2"/>
            <polygon points="46,60 50,65 54,60" fill="white"/>
          </g>
        </svg>
      `,
      'monster-brown': `
        <svg class="monster-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="26" cy="22" r="10" fill="#A75D5D" stroke="#2C2643" stroke-width="4"/>
          <circle cx="26" cy="22" r="5" fill="#DDBB99"/>
          <circle cx="74" cy="22" r="10" fill="#A75D5D" stroke="#2C2643" stroke-width="4"/>
          <circle cx="74" cy="22" r="5" fill="#DDBB99"/>
          <rect x="15" y="24" width="70" height="66" rx="33" fill="#A75D5D" stroke="#2C2643" stroke-width="4"/>
          <circle cx="34" cy="46" r="8" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="34" cy="46" r="4.5" fill="#2C2643"/>
          <circle cx="32" cy="44" r="1.8" fill="white"/>
          <circle cx="66" cy="46" r="8" fill="white" stroke="#2C2643" stroke-width="3"/>
          <circle cx="66" cy="46" r="4.5" fill="#2C2643"/>
          <circle cx="63" cy="44" r="1.8" fill="white"/>
          <ellipse cx="50" cy="54" rx="10" ry="7" fill="#F5E6D3" stroke="#2C2643" stroke-width="2.5"/>
          <polygon points="47,52 53,52 50,55" fill="#2C2643"/>
          <g class="monster-jaw" style="transition: transform 0.2s;">
            <rect x="32" y="66" width="36" height="13" rx="6.5" fill="#2C2643" stroke="#2C2643" stroke-width="2"/>
            <ellipse cx="50" cy="72" rx="4" ry="3" fill="#FF85B3"/>
          </g>
        </svg>
      `
    };
    return svgs[monsterId];
  }

  initMonstrosGame(container) {
    const allCategories = [...new Set(this.words.map(w => w.categoria).filter(Boolean))];
    
    if (allCategories.length < 2) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Por favor adicione palavras de pelo menos 2 categorias diferentes no Painel Administrativo para jogar.</p>`;
      return;
    }

    const monstersPool = [
      { id: 'monster-green', name: 'Gluglu' },
      { id: 'monster-pink', name: 'Fifi' },
      { id: 'monster-yellow', name: 'Tutu' },
      { id: 'monster-blue', name: 'Bubu' },
      { id: 'monster-purple', name: 'Kiko' },
      { id: 'monster-orange', name: 'Zaza' },
      { id: 'monster-cyan', name: 'Mimi' },
      { id: 'monster-brown', name: 'Lulu' }
    ];

    const numMonsters = Math.min(4, allCategories.length);
    const chosenCategories = this.shuffle(allCategories).slice(0, numMonsters);
    const chosenMonsters = this.shuffle(monstersPool).slice(0, numMonsters);

    const activeMonsters = chosenMonsters.map((m, idx) => {
      const category = chosenCategories[idx];
      const emoji = this.getCategoryEmoji(category);
      return { id: m.id, name: m.name, category: category, rule: `${category} ${emoji}` };
    });

    // Pick a target category from the selected monsters
    const selectedMonster = activeMonsters[Math.floor(Math.random() * activeMonsters.length)];
    const items = this.words.filter(w => w.categoria === selectedMonster.category);
    const targetWord = this.getRandomAvoidingRecent(items);

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; flex-grow:1; width:100%;">
        <h4 style="font-size:1.4rem; font-weight:900; color:var(--primary-dark); text-align:center; margin-bottom: 20px;">
          Alimenta o monstro correto com o item!
        </h4>
        <div class="monsters-container" id="monsters-arena" style="gap: 12px; justify-content: space-between;">
          
          ${activeMonsters.map(m => `
            <div class="monster-wrapper" id="arena-${m.id}" data-category="${m.category}">
              ${this.getMonsterSVG(m.id)}
              <div class="monster-name" style="font-size:1.2rem; font-weight:900; margin-top:8px;">${m.name}</div>
              <div class="monster-rule" style="font-size:0.85rem; font-weight:900; padding:6px 10px; margin-top:6px; background:var(--accent-yellow); color:#2C2643; border:3px solid #2C2643; border-radius:12px; box-shadow:0 3px 0 #2C2643; text-transform:uppercase;">${m.rule}</div>
            </div>
          `).join('')}
          
          <!-- Central Draggable Item -->
          <div id="feeder-item" class="monsters-feeder-item" data-category="${targetWord.categoria}" onmousedown="app.monsterDragStart(event)" ontouchstart="app.monsterDragStart(event)">
            <div class="square-img-wrapper" style="width: 100%; aspect-ratio: 1; border: none; border-radius: var(--border-radius-sm); overflow: hidden; position: relative;">
              <img src="${targetWord.imagem}" alt="${targetWord.palavra}" style="${app.getImgStyle(targetWord)}">
            </div>
            <span>${targetWord.palavra}</span>
          </div>
          
        </div>
      </div>
    `;

    this.showMascotBubble(`Arrasta o/a ${targetWord.palavra} para o monstro correcto!`);
  }

  monsterDragStart(event) {
    event.preventDefault();
    const item = document.getElementById('feeder-item');
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    const initialRect = item.getBoundingClientRect();
    const offsetLeft = clientX - initialRect.left;
    const offsetTop = clientY - initialRect.top;
    
    const originalLeft = item.style.left;
    const originalTop = item.style.top;
    const originalTransform = item.style.transform;
    
    item.style.position = 'absolute';
    item.style.transform = 'none';
    
    const arenaRect = document.getElementById('monsters-arena').getBoundingClientRect();
    
    const onMove = (moveEvent) => {
      const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const localX = curX - arenaRect.left - offsetLeft;
      const localY = curY - arenaRect.top - offsetTop;
      
      item.style.left = `${localX}px`;
      item.style.top = `${localY}px`;
      
      this.checkMonsterProximity(curX, curY);
    };
    
    const onEnd = (endEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      
      document.querySelectorAll('.monster-svg').forEach(el => el.classList.remove('monster-mouth-open'));
      
      const endX = endEvent.changedTouches ? endEvent.changedTouches[0].clientX : endEvent.clientX;
      const endY = endEvent.changedTouches ? endEvent.changedTouches[0].clientY : endEvent.clientY;
      
      const itemCategory = item.getAttribute('data-category');
      const wrappers = document.querySelectorAll('.monster-wrapper');
      let droppedCorrect = false;
      let droppedWrong = false;
      let targetWrapper = null;
      
      wrappers.forEach(wrap => {
        const rect = wrap.getBoundingClientRect();
        if (endX >= rect.left && endX <= rect.right && endY >= rect.top && endY <= rect.bottom) {
          const mCat = wrap.getAttribute('data-category');
          targetWrapper = wrap;
          if (mCat === itemCategory) {
            droppedCorrect = true;
          } else {
            droppedWrong = true;
          }
        }
      });
      
      if (droppedCorrect && targetWrapper) {
        item.style.display = 'none';
        targetWrapper.querySelector('.monster-svg').classList.add('monster-chewing');
        this.addStar();
        this.triggerCelebration(() => {
          targetWrapper.querySelector('.monster-svg').classList.remove('monster-chewing');
          this.initMonstrosGame(document.getElementById('game-card-container'));
        });
      } else if (droppedWrong) {
        this.showMascotBubble("Esse monstro não gosta desse item! 🤢");
        item.style.left = originalLeft;
        item.style.top = originalTop;
        item.style.transform = originalTransform;
      } else {
        item.style.left = originalLeft;
        item.style.top = originalTop;
        item.style.transform = originalTransform;
      }
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  checkMonsterProximity(x, y) {
    const wrappers = document.querySelectorAll('.monster-wrapper');
    wrappers.forEach(wrap => {
      const rect = wrap.getBoundingClientRect();
      const svg = wrap.querySelector('.monster-svg');
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        svg.classList.add('monster-mouth-open');
      } else {
        svg.classList.remove('monster-mouth-open');
      }
    });
  }

  // --- JOGO 5.2: MONSTROS DOS FONEMAS ---
  initMonstrosFonemasGame(container) {
    const monstersPool = [
      { id: 'monster-green', name: 'Gluglu' },
      { id: 'monster-pink', name: 'Fifi' },
      { id: 'monster-yellow', name: 'Tutu' },
      { id: 'monster-blue', name: 'Bubu' },
      { id: 'monster-purple', name: 'Kiko' },
      { id: 'monster-orange', name: 'Zaza' },
      { id: 'monster-cyan', name: 'Mimi' },
      { id: 'monster-brown', name: 'Lulu' }
    ];

    // Get unique phonemes that have at least 1 word
    const phonemes = [...new Set(this.words.map(w => w.fonema).filter(f => f && f.trim() !== ''))];
    
    if (phonemes.length < 2) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Por favor adicione mais palavras com fonemas diferentes no Painel administrativo para jogar.</p>`;
      return;
    }

    const numMonsters = Math.min(4, phonemes.length);
    const chosenPhonemes = this.shuffle(phonemes).slice(0, numMonsters);
    const chosenMonsters = this.shuffle(monstersPool).slice(0, numMonsters);
    
    const activeMonsters = chosenMonsters.map((m, idx) => {
      return { ...m, phoneme: chosenPhonemes[idx], rule: `${chosenPhonemes[idx]} 👄` };
    });

    const targetPhoneme = chosenPhonemes[Math.floor(Math.random() * chosenPhonemes.length)];
    const items = this.words.filter(w => w.fonema === targetPhoneme);
    const targetWord = this.getRandomAvoidingRecent(items);

    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; flex-grow:1; width:100%;">
        <h4 style="font-size:1.4rem; font-weight:900; color:var(--primary-dark); text-align:center; margin-bottom: 20px;">
          Alimenta o monstro com o fonema correto!
        </h4>
        <div class="monsters-container" id="monsters-arena" style="gap: 12px; justify-content: space-around;">
          
          ${activeMonsters.map(m => `
            <div class="monster-wrapper" id="arena-${m.id}" data-phoneme="${m.phoneme}">
              ${this.getMonsterSVG(m.id)}
              <div class="monster-name" style="font-size:1.2rem; font-weight:900; margin-top:8px;">${m.name}</div>
              <div class="monster-rule" style="font-size:0.85rem; font-weight:900; padding:6px 10px; margin-top:6px; background:var(--accent-purple); color:white; border:3px solid #2C2643; border-radius:12px; box-shadow:0 3px 0 #2C2643; text-transform:uppercase;">${m.rule}</div>
            </div>
          `).join('')}
          
          <!-- Central Draggable Item -->
          <div id="feeder-item" class="monsters-feeder-item" data-phoneme="${targetWord.fonema}" onmousedown="app.monsterFonemaDragStart(event)" ontouchstart="app.monsterFonemaDragStart(event)">
            <div class="square-img-wrapper" style="width: 100%; aspect-ratio: 1; border: none; border-radius: var(--border-radius-sm); overflow: hidden; position: relative;">
              <img src="${targetWord.imagem}" alt="${targetWord.palavra}" style="${app.getImgStyle(targetWord)}">
            </div>
            <span>${targetWord.palavra}</span>
          </div>
          
        </div>
      </div>
    `;

    this.showMascotBubble(`Qual monstro quer comer a letra "${targetPhoneme}"?`);
  }

  monsterFonemaDragStart(event) {
    event.preventDefault();
    const item = document.getElementById('feeder-item');
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    const initialRect = item.getBoundingClientRect();
    const offsetLeft = clientX - initialRect.left;
    const offsetTop = clientY - initialRect.top;
    
    const originalLeft = item.style.left;
    const originalTop = item.style.top;
    const originalTransform = item.style.transform;
    
    item.style.position = 'absolute';
    item.style.transform = 'none';
    
    const arenaRect = document.getElementById('monsters-arena').getBoundingClientRect();
    
    const onMove = (moveEvent) => {
      const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      const localX = curX - arenaRect.left - offsetLeft;
      const localY = curY - arenaRect.top - offsetTop;
      
      item.style.left = `${localX}px`;
      item.style.top = `${localY}px`;
      
      this.checkMonsterProximity(curX, curY);
    };
    
    const onEnd = (endEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      
      document.querySelectorAll('.monster-svg').forEach(el => el.classList.remove('monster-mouth-open'));
      
      const endX = endEvent.changedTouches ? endEvent.changedTouches[0].clientX : endEvent.clientX;
      const endY = endEvent.changedTouches ? endEvent.changedTouches[0].clientY : endEvent.clientY;
      
      const itemPhoneme = item.getAttribute('data-phoneme');
      const wrappers = document.querySelectorAll('.monster-wrapper');
      let droppedCorrect = false;
      let droppedWrong = false;
      let targetWrapper = null;
      
      wrappers.forEach(wrap => {
        const rect = wrap.getBoundingClientRect();
        if (endX >= rect.left && endX <= rect.right && endY >= rect.top && endY <= rect.bottom) {
          const mPhoneme = wrap.getAttribute('data-phoneme');
          targetWrapper = wrap;
          if (mPhoneme === itemPhoneme) {
            droppedCorrect = true;
          } else {
            droppedWrong = true;
          }
        }
      });
      
      if (droppedCorrect && targetWrapper) {
        item.style.display = 'none';
        targetWrapper.querySelector('.monster-svg').classList.add('monster-chewing');
        this.addStar();
        this.triggerCelebration(() => {
          targetWrapper.querySelector('.monster-svg').classList.remove('monster-chewing');
          this.initMonstrosFonemasGame(document.getElementById('game-card-container'));
        });
      } else if (droppedWrong) {
        this.showMascotBubble("Esse monstro não quer essa letra! 🤢");
        item.style.left = originalLeft;
        item.style.top = originalTop;
        item.style.transform = originalTransform;
      } else {
        item.style.left = originalLeft;
        item.style.top = originalTop;
        item.style.transform = originalTransform;
      }
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  // --- JOGO 6: JOGO DA MEMÓRIA ---
  initMemoriaGame(container) {
    if (this.words.length < 6) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Adicione mais palavras no painel administrativo (mínimo 6) para jogar.</p>`;
      return;
    }
    const categories = this.shuffle([...new Set(this.words.map(w => w.categoria))]);
    let selected = [];
    for (const cat of categories) {
      const catWords = this.words.filter(w => w.categoria === cat);
      if (catWords.length >= 6) {
        selected = this.shuffle(catWords).slice(0, 6);
        break;
      }
    }
    if (selected.length === 0) {
      selected = this.shuffle(this.words).slice(0, 6);
    }
    const cardsPool = this.shuffle([...selected, ...selected]);
    
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:20px; flex-grow:1; width:100%;">
        <div class="memory-grid">
          ${cardsPool.map((word) => `
            <div class="memory-card" data-word="${word.palavra}" onclick="app.flipMemoryCard(this)">
              <div class="card-face card-back">
                <span class="card-back-pattern">❓</span>
              </div>
              <div class="card-face card-front">
                <img src="${word.imagem}" alt="${word.palavra}" style="${app.getImgStyle(word)}">
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    this.memoryFlippedCards = [];
    this.memoryMatchedCount = 0;
    this.showMascotBubble("Encontra os pares!");
  }

  flipMemoryCard(cardEl) {
    if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched') || this.memoryFlippedCards.length >= 2) {
      return;
    }
    
    cardEl.classList.add('flipped');
    this.memoryFlippedCards.push(cardEl);
    
    if (this.memoryFlippedCards.length === 2) {
      const [card1, card2] = this.memoryFlippedCards;
      const word1 = card1.getAttribute('data-word');
      const word2 = card2.getAttribute('data-word');
      
      if (word1 === word2) {
        setTimeout(() => {
          card1.classList.add('matched');
          card2.classList.add('matched');
          this.memoryFlippedCards = [];
          this.memoryMatchedCount += 2;
          this.addStar();
          
          if (this.memoryMatchedCount === 12) {
            this.showMascotBubble("Encontraste todos os pares! 🎉");
            this.triggerCelebration(() => {
              this.initMemoriaGame(document.getElementById('game-card-container'));
            });
          }
        }, 800);
      } else {
        setTimeout(() => {
          card1.classList.remove('flipped');
          card2.classList.remove('flipped');
          this.memoryFlippedCards = [];
        }, 1500);
      }
    }
  }

  // --- JOGO 7: DETETIVE DE HISTÓRIAS ---
  initDetetiveGame(container) {
    if (this.sequences.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Crie histórias no Painel Administrativo.</p>`;
      return;
    }
    const seq = this.getRandomAvoidingRecentSequence(this.sequences);
    const scrambled = this.shuffle([...seq.etapas]);
    
    container.innerHTML = `
      <div class="detetive-layout" style="display:flex; flex-direction:column; align-items:center; width:100%;">
        <div class="detetive-theme-banner" style="background:var(--accent-yellow); border:3.5px solid #2C2643; border-radius:20px; padding:14px 28px; font-size:1.6rem; font-weight:900; color:#2C2643; display:inline-block; margin-bottom:20px; box-shadow:0 5px 0 #2C2643; text-transform:uppercase; text-align:center; letter-spacing: 0.5px;">
          Tema da História: ${seq.nome}
        </div>
        
        <div class="detetive-cards-row" id="detetive-cards-pool" style="margin-bottom: 30px;">
          ${scrambled.map((item, idx) => `
            <div class="detetive-card" id="seq-card-${idx}" data-order="${item.ordem}" data-text="${item.texto}" onmousedown="app.detetiveDragStart(event, this)" ontouchstart="app.detetiveDragStart(event, this)">
              <div class="square-img-wrapper" style="width: 100%; height: 100%; border: none; position: relative;">
                <img src="${item.imagem}" alt="Etapa" style="width: 100%; height: 100%; object-fit: cover;">
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="detetive-slots-row" style="margin-bottom:20px; display:flex; justify-content:center; gap:28px; width:100%; max-width:850px;">
          <div class="detetive-slot-container" style="display:flex; flex-direction:column; align-items:center; width:180px;">
            <div class="detetive-slot" data-slot="1">
              <div class="detetive-slot-header">1º</div>
            </div>
            <div id="detetive-text-slot-1" class="detetive-text-display" style="width:100%; text-align:center; font-size:0.95rem; font-weight:800; min-height:80px; color:var(--text-muted); margin-top:12px; display:flex; align-items:center; justify-content:center; transition: all 0.3s ease; border:3px dashed rgba(44, 38, 67, 0.2); border-radius:12px; padding:8px; background: rgba(255, 255, 255, 0.4);">...</div>
          </div>
          <div class="detetive-slot-container" style="display:flex; flex-direction:column; align-items:center; width:180px;">
            <div class="detetive-slot" data-slot="2">
              <div class="detetive-slot-header">2º</div>
            </div>
            <div id="detetive-text-slot-2" class="detetive-text-display" style="width:100%; text-align:center; font-size:0.95rem; font-weight:800; min-height:80px; color:var(--text-muted); margin-top:12px; display:flex; align-items:center; justify-content:center; transition: all 0.3s ease; border:3px dashed rgba(44, 38, 67, 0.2); border-radius:12px; padding:8px; background: rgba(255, 255, 255, 0.4);">...</div>
          </div>
          <div class="detetive-slot-container" style="display:flex; flex-direction:column; align-items:center; width:180px;">
            <div class="detetive-slot" data-slot="3">
              <div class="detetive-slot-header">3º</div>
            </div>
            <div id="detetive-text-slot-3" class="detetive-text-display" style="width:100%; text-align:center; font-size:0.95rem; font-weight:800; min-height:80px; color:var(--text-muted); margin-top:12px; display:flex; align-items:center; justify-content:center; transition: all 0.3s ease; border:3px dashed rgba(44, 38, 67, 0.2); border-radius:12px; padding:8px; background: rgba(255, 255, 255, 0.4);">...</div>
          </div>
        </div>
      </div>
    `;
    this.showMascotBubble("Coloca na ordem correcta!");
    this.updateStoryTextDisplay();
  }

  detetiveDragStart(event, card) {
    event.preventDefault();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    const initialRect = card.getBoundingClientRect();
    const offsetLeft = clientX - initialRect.left;
    const offsetTop = clientY - initialRect.top;
    
    const ghost = card.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.left = `${clientX - offsetLeft}px`;
    ghost.style.top = `${clientY - offsetTop}px`;
    ghost.style.width = `${initialRect.width}px`;
    ghost.style.height = `${initialRect.height}px`;
    ghost.style.zIndex = '1000';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.8';
    document.body.appendChild(ghost);
    
    card.style.opacity = '0.2';
    const slots = document.querySelectorAll('.detetive-slot');
    
    const onMove = (moveEvent) => {
      const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      ghost.style.left = `${curX - offsetLeft}px`;
      ghost.style.top = `${curY - offsetTop}px`;
      
      slots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        if (curX >= rect.left && curX <= rect.right && curY >= rect.top && curY <= rect.bottom) {
          slot.classList.add('drag-over');
        } else {
          slot.classList.remove('drag-over');
        }
      });
    };
    
    const onEnd = (endEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      
      slots.forEach(slot => slot.classList.remove('drag-over'));
      
      const endX = endEvent.changedTouches ? endEvent.changedTouches[0].clientX : endEvent.clientX;
      const endY = endEvent.changedTouches ? endEvent.changedTouches[0].clientY : endEvent.clientY;
      
      let droppedInSlot = false;
      
      slots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        if (endX >= rect.left && endX <= rect.right && endY >= rect.top && endY <= rect.bottom) {
          const existingCard = slot.querySelector('.detetive-card');
          if (existingCard) {
            document.getElementById('detetive-cards-pool').appendChild(existingCard);
          }
          
          slot.appendChild(card);
          card.style.position = 'relative';
          card.style.left = '0';
          card.style.top = '0';
          card.style.opacity = '1';
          
          const numEl = card.querySelector('.detetive-card-number');
          if (numEl) numEl.innerText = `${slot.getAttribute('data-slot')}º`;
          this.showMascotBubble(card.getAttribute('data-text'));
          droppedInSlot = true;
        }
      });
      
      if (!droppedInSlot) {
        document.getElementById('detetive-cards-pool').appendChild(card);
        card.style.position = 'relative';
        card.style.left = '0';
        card.style.top = '0';
        card.style.opacity = '1';
        const numEl = card.querySelector('.detetive-card-number');
        if (numEl) numEl.innerText = '❓';
      }
      
      document.body.removeChild(ghost);
      this.checkStoryCompletion();
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  checkStoryCompletion() {
    this.updateStoryTextDisplay();
    
    const slots = document.querySelectorAll('.detetive-slot');
    let allFilled = true;
    let correctlyOrdered = true;
    
    slots.forEach(slot => {
      const card = slot.querySelector('.detetive-card');
      if (!card) {
        allFilled = false;
      } else {
        const cardOrder = parseInt(card.getAttribute('data-order'));
        const slotNumber = parseInt(slot.getAttribute('data-slot'));
        if (cardOrder !== slotNumber) {
          correctlyOrdered = false;
        }
      }
    });
    
    if (allFilled && correctlyOrdered) {
      this.addStar();
      this.triggerCelebration(() => {
        this.initDetetiveGame(document.getElementById('game-card-container'));
      });
    }
  }

  updateStoryTextDisplay() {
    const slots = document.querySelectorAll('.detetive-slot');
    slots.forEach(slot => {
      const slotIndex = slot.getAttribute('data-slot');
      const card = slot.querySelector('.detetive-card');
      const textSlot = document.getElementById(`detetive-text-slot-${slotIndex}`);
      if (textSlot) {
        if (card) {
          const cardOrder = parseInt(card.getAttribute('data-order'));
          const slotNumber = parseInt(slotIndex);
          if (cardOrder === slotNumber) {
            textSlot.innerText = card.getAttribute('data-text');
            textSlot.style.color = 'var(--text-main)';
            textSlot.style.background = '#E8FDF5';
            textSlot.style.border = '3px solid var(--accent-mint)';
            textSlot.style.borderRadius = '18px';
            textSlot.style.padding = '10px 14px';
            textSlot.style.boxShadow = '0 4px 0 rgba(42, 209, 163, 0.15)';
          } else {
            textSlot.innerText = '...';
            textSlot.style.color = 'var(--text-muted)';
            textSlot.style.background = 'rgba(255, 255, 255, 0.4)';
            textSlot.style.border = '3px dashed rgba(44, 38, 67, 0.2)';
            textSlot.style.borderRadius = '12px';
            textSlot.style.padding = '8px';
            textSlot.style.boxShadow = 'none';
          }
        } else {
          textSlot.innerText = '...';
          textSlot.style.color = 'var(--text-muted)';
          textSlot.style.background = 'rgba(255, 255, 255, 0.4)';
          textSlot.style.border = '3px dashed rgba(44, 38, 67, 0.2)';
          textSlot.style.borderRadius = '12px';
          textSlot.style.padding = '8px';
          textSlot.style.boxShadow = 'none';
        }
      }
    });
  }

  // --- JOGO 8: COMBOIO DAS SÍLABAS ---
  initComboioGame(container) {
    const validWords = this.words.filter(w => w.silabas && w.silabas.includes('-'));
    if (validWords.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Por favor adicione palavras com divisão silábica (ex: Ga-to) para jogar.</p>`;
      return;
    }
    
    const word = this.getRandomAvoidingRecent(validWords);
    const syllables = word.silabas.split('-');
    
    this.comboioState.targetWord = word;
    this.comboioState.currentSyllables = syllables;
    
    const shuffledSyllables = this.shuffle(syllables.map((s, idx) => ({ text: s, originalIdx: idx })));
    
    container.innerHTML = `
      <div class="comboio-container">
        <h4 style="font-size:1.3rem; font-weight:800; color:var(--primary-dark); text-align:center;">
          Arrasta as sílabas para as carruagens certas e constrói a palavra!
        </h4>
        
        <div class="comboio-target-card">
          <div class="square-img-wrapper" style="width: min(180px, 20vh); aspect-ratio: 1; border: none; margin-bottom: 8px; position: relative;">
            <img src="${word.imagem}" alt="${word.palavra}" style="${app.getImgStyle(word)}">
          </div>
          <span>${word.palavra}</span>
        </div>
        
        <div class="train-track" id="train-track-container">
          <div class="train-engine">
            <div class="train-engine-window"></div>
            <div class="train-engine-chimney"></div>
            <div class="train-wheel train-wheel-1"></div>
            <div class="train-wheel train-wheel-2"></div>
          </div>
          
          ${syllables.map((_, idx) => `
            <div style="display:flex; flex-direction:column; align-items:center; gap:8px; flex-shrink:0;">
              <div class="wagon-number" style="margin-top:0; margin-bottom:4px;">${idx + 1}ª Sílaba</div>
              <div class="train-wagon" data-wagon-index="${idx}">
                <div class="wagon-slot" data-slot-index="${idx}"></div>
                <div class="train-wheel train-wheel-1"></div>
                <div class="train-wheel train-wheel-2"></div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="comboio-pool" id="comboio-syllables-pool">
          ${shuffledSyllables.map((item) => `
            <div class="syllable-card" data-syllable="${item.text}" data-original-idx="${item.originalIdx}" onmousedown="app.comboioDragStart(event, this)" ontouchstart="app.comboioDragStart(event, this)">
              ${item.text}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    this.showMascotBubble("Coloca as sílabas no comboio!");
  }

  comboioDragStart(event, card) {
    event.preventDefault();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    const initialRect = card.getBoundingClientRect();
    const offsetLeft = clientX - initialRect.left;
    const offsetTop = clientY - initialRect.top;
    
    const ghost = card.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.left = `${clientX - offsetLeft}px`;
    ghost.style.top = `${clientY - offsetTop}px`;
    ghost.style.width = `${initialRect.width}px`;
    ghost.style.height = `${initialRect.height}px`;
    ghost.style.zIndex = '1000';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.9';
    document.body.appendChild(ghost);
    
    card.style.opacity = '0.2';
    const slots = document.querySelectorAll('.wagon-slot');
    
    const onMove = (moveEvent) => {
      const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      ghost.style.left = `${curX - offsetLeft}px`;
      ghost.style.top = `${curY - offsetTop}px`;
      
      slots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        if (curX >= rect.left && curX <= rect.right && curY >= rect.top && curY <= rect.bottom) {
          slot.parentElement.classList.add('drag-over');
        } else {
          slot.parentElement.classList.remove('drag-over');
        }
      });
    };
    
    const onEnd = (endEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      
      slots.forEach(slot => slot.parentElement.classList.remove('drag-over'));
      
      const endX = endEvent.changedTouches ? endEvent.changedTouches[0].clientX : endEvent.clientX;
      const endY = endEvent.changedTouches ? endEvent.changedTouches[0].clientY : endEvent.clientY;
      
      let droppedInSlot = false;
      const cardSyllable = card.getAttribute('data-syllable');
      const originalIdx = parseInt(card.getAttribute('data-original-idx'));
      
      slots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        if (endX >= rect.left && endX <= rect.right && endY >= rect.top && endY <= rect.bottom) {
          const slotIndex = parseInt(slot.getAttribute('data-slot-index'));
          
          if (slot.children.length === 0) {
            const targetSyllable = this.comboioState.currentSyllables[slotIndex];
            if (cardSyllable.toLowerCase() === targetSyllable.toLowerCase()) {
              slot.appendChild(card);
              card.style.position = 'relative';
              card.style.left = '0';
              card.style.top = '0';
              card.style.opacity = '1';
              card.style.cursor = 'default';
              card.onmousedown = null;
              card.ontouchstart = null;
              droppedInSlot = true;
              this.addStar();
              this.checkComboioCompletion();
            } else {
              this.showMascotBubble("Hum, essa sílaba não fica nessa carruagem! 🚂");
            }
          }
        }
      });
      
      if (!droppedInSlot) {
        card.style.opacity = '1';
      }
      if (document.body.contains(ghost)) {
        document.body.removeChild(ghost);
      }
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  checkComboioCompletion() {
    const slots = document.querySelectorAll('.wagon-slot');
    let allFilled = true;
    slots.forEach(slot => {
      if (slot.children.length === 0) allFilled = false;
    });
    
    if (allFilled) {
      this.triggerCelebration(() => {
        this.initComboioGame(document.getElementById('game-card-container'));
      });
    }
  }

  // --- JOGO 9: A SOPA DE LETRAS ---
  initSopaGame(container) {
    if (this.words.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Por favor adicione palavras para poder jogar.</p>`;
      return;
    }
    
    const word = this.getRandomAvoidingRecent(this.words);
    const wordLetters = word.palavra.toUpperCase().split('');
    
    this.sopaState.targetWord = word;
    this.sopaState.targetLetters = wordLetters;
    
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const distractors = [];
    while (distractors.length < 3) {
      const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!wordLetters.includes(randomLetter) && !distractors.includes(randomLetter)) {
        distractors.push(randomLetter);
      }
    }
    
    const allPoolLetters = this.shuffle([
      ...wordLetters.map((l, idx) => ({ text: l, originalIdx: idx, isDistractor: false })),
      ...distractors.map(l => ({ text: l, originalIdx: -1, isDistractor: true }))
    ]);
    
    container.innerHTML = `
      <div class="sopa-container">
        <!-- Left Column: Instructions, Word & Slots -->
        <div class="sopa-left-column">
          <h4 class="sopa-instruction-title">
            Arrasta as letras da sopa e constrói a palavra!
          </h4>
          
          <div class="sopa-target-card">
            <div class="square-img-wrapper" style="width: min(180px, 20vh); aspect-ratio: 1; border: none; margin-bottom: 8px; position: relative;">
              <img src="${word.imagem}" alt="${word.palavra}" style="${app.getImgStyle(word)}">
            </div>
          </div>
          
          <div class="sopa-slots-row">
            ${wordLetters.map((_, idx) => `
              <div class="soup-letter-slot" data-slot-index="${idx}"></div>
            `).join('')}
          </div>
        </div>
        
        <!-- Right Column: Soup Bowl -->
        <div class="sopa-right-column">
          <div class="soup-pot-area">
            <div class="soup-letters-pool" id="soup-letters-container">
              ${allPoolLetters.map((item, idx) => `
                <div class="soup-letter-bubble" data-letter="${item.text}" data-original-idx="${item.originalIdx}" id="soup-bubble-${idx}" onmousedown="app.sopaDragStart(event, this)" ontouchstart="app.sopaDragStart(event, this)">
                  ${item.text}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.showMascotBubble("Encontra as letras certas na sopa!");
  }

  sopaDragStart(event, bubble) {
    event.preventDefault();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    
    const initialRect = bubble.getBoundingClientRect();
    const offsetLeft = clientX - initialRect.left;
    const offsetTop = clientY - initialRect.top;
    
    const ghost = bubble.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.left = `${clientX - offsetLeft}px`;
    ghost.style.top = `${clientY - offsetTop}px`;
    ghost.style.width = `${initialRect.width}px`;
    ghost.style.height = `${initialRect.height}px`;
    ghost.style.zIndex = '1000';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.9';
    document.body.appendChild(ghost);
    
    bubble.style.opacity = '0.2';
    const slots = document.querySelectorAll('.soup-letter-slot');
    
    const onMove = (moveEvent) => {
      const curX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;
      ghost.style.left = `${curX - offsetLeft}px`;
      ghost.style.top = `${curY - offsetTop}px`;
      
      slots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        if (curX >= rect.left && curX <= rect.right && curY >= rect.top && curY <= rect.bottom) {
          slot.classList.add('drag-over');
        } else {
          slot.classList.remove('drag-over');
        }
      });
    };
    
    const onEnd = (endEvent) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      
      slots.forEach(slot => slot.classList.remove('drag-over'));
      
      const endX = endEvent.changedTouches ? endEvent.changedTouches[0].clientX : endEvent.clientX;
      const endY = endEvent.changedTouches ? endEvent.changedTouches[0].clientY : endEvent.clientY;
      
      let droppedInSlot = false;
      const bubbleLetter = bubble.getAttribute('data-letter');
      
      slots.forEach(slot => {
        const rect = slot.getBoundingClientRect();
        if (endX >= rect.left && endX <= rect.right && endY >= rect.top && endY <= rect.bottom) {
          const slotIndex = parseInt(slot.getAttribute('data-slot-index'));
          
          if (slot.children.length === 0) {
            const expectedLetter = this.sopaState.targetLetters[slotIndex];
            if (bubbleLetter === expectedLetter) {
              slot.appendChild(bubble);
              bubble.style.position = 'relative';
              bubble.style.left = '0';
              bubble.style.top = '0';
              bubble.style.opacity = '1';
              bubble.style.cursor = 'default';
              bubble.onmousedown = null;
              bubble.ontouchstart = null;
              droppedInSlot = true;
              this.addStar();
              this.checkSopaCompletion();
            } else {
              this.showMascotBubble("Hum, essa letra não fica aí! 🥣");
            }
          }
        }
      });
      
      if (!droppedInSlot) {
        bubble.style.opacity = '1';
      }
      if (document.body.contains(ghost)) {
        document.body.removeChild(ghost);
      }
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }

  checkSopaCompletion() {
    const slots = document.querySelectorAll('.soup-letter-slot');
    let allFilled = true;
    slots.forEach(slot => {
      if (slot.children.length === 0) allFilled = false;
    });
    
    if (allFilled) {
      this.triggerCelebration(() => {
        this.initSopaGame(document.getElementById('game-card-container'));
      });
    }
  }

  // --- JOGO 10: ROLETA DO TRAVA-LÍNGUAS ---
  initTravaLinguasGame(container) {
    if (this.travaLinguas.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Por favor adicione trava-línguas no painel administrativo.</p>`;
      return;
    }
    
    container.innerHTML = `
      <div class="roleta-container">
        <!-- Left Side: Wheel -->
        <div class="roleta-left-side">
          <div class="roleta-wrapper">
            <div class="roleta-marker"></div>
            <div id="trava-wheel" class="roleta-wheel"></div>
            <div class="roleta-center">RODA!</div>
          </div>
        </div>
        
        <!-- Right Side: Content -->
        <div class="roleta-right-side">
          <h4 class="roleta-instruction-title">
            Gira a roleta para escolher um trava-línguas desafiante!
          </h4>
          <button id="trava-spin-btn" class="btn-action" onclick="app.spinTravaLinguas()">Girar Roleta 🎡</button>
          <div id="trava-result" class="roleta-result-panel" style="opacity: 0;">
            <div id="trava-emoji" class="roleta-result-emoji">👅</div>
            <div id="trava-text" class="roleta-result-text">Clica em Girar!</div>
            <button id="trava-done-btn" class="btn-action" style="margin-top: 15px; background:var(--accent-mint); color:white;" onclick="app.completeTrava()">Consegui dizer! 🎉</button>
          </div>
        </div>
      </div>
    `;
    
    this.renderTravaLinguasLabels();
    this.showMascotBubble("Gira a roleta do trava-línguas!");
  }

  renderTravaLinguasLabels() {
    const wheel = document.getElementById('trava-wheel');
    if (!wheel || this.travaLinguas.length === 0) return;
    
    // Always 8 color sectors
    const length = 8;
    const colors = ['#FF7B93', '#4BA3FF', '#2AD1A3', '#FFD026', '#9D7BFF', '#FF8C32', '#00D2C4', '#FF4D4D'];
    let gradientParts = [];
    const percentPerSlice = 100 / length;
    for (let i = 0; i < length; i++) {
      const color = colors[i % colors.length];
      gradientParts.push(`${color} ${i * percentPerSlice}% ${(i + 1) * percentPerSlice}%`);
    }
    wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;
    
    // Render dividing spoke lines
    wheel.innerHTML = `
      <div class="wheel-spoke" style="transform: rotate(0deg);"></div>
      <div class="wheel-spoke" style="transform: rotate(45deg);"></div>
      <div class="wheel-spoke" style="transform: rotate(90deg);"></div>
      <div class="wheel-spoke" style="transform: rotate(135deg);"></div>
    `;
  }

  spinTravaLinguas() {
    let list = [...this.travaLinguas];
    if (this.travaState.spinning || list.length === 0) return;
    this.travaState.spinning = true;
    
    // Fill up to exactly 8 items (repeat if necessary)
    while (list.length < 8) {
      list = list.concat(this.travaLinguas);
    }
    list = list.slice(0, 8);
    
    const wheel = document.getElementById('trava-wheel');
    const resultPanel = document.getElementById('trava-result');
    const spinBtn = document.getElementById('trava-spin-btn');
    
    resultPanel.style.opacity = '0';
    spinBtn.disabled = true;
    
    this.showMascotBubble("A girar a roleta...");
    
    const targetIdx = Math.floor(Math.random() * 8);
    const sliceAngle = 360 / 8;
    const newAngle = this.travaState.currentAngle + 1800 + (360 - (targetIdx * sliceAngle) - (sliceAngle / 2));
    this.travaState.currentAngle = newAngle;
    
    wheel.style.transform = `rotate(${newAngle}deg)`;
    
    setTimeout(() => {
      this.travaState.spinning = false;
      spinBtn.disabled = false;
      
      const tl = list[targetIdx];
      document.getElementById('trava-emoji').innerText = tl.emoji;
      document.getElementById('trava-text').innerText = tl.texto;
      resultPanel.style.opacity = '1';
      
      this.showMascotBubble("Diz o trava-línguas sem te enganares!");
    }, 4100);
  }

  completeTrava() {
    this.addStar();
    this.triggerCelebration(() => {
      this.initTravaLinguasGame(document.getElementById('game-card-container'));
    });
  }

  // --- SUBMISSIONS ADMIN PANEL & EDITS ---

  handleAddTrava(event) {
    event.preventDefault();
    const text = document.getElementById('trava-text-input').value.trim();
    const emoji = document.getElementById('trava-emoji-input').value.trim();
    
    const data = { texto: text, emoji: emoji };
    
    if (this.editingTravaIdx !== null) {
      this.travaLinguas[this.editingTravaIdx] = data;
      this.editingTravaIdx = null;
      document.querySelector('#add-trava-form button[type="submit"]').innerText = "Adicionar Trava-Línguas";
      this.showMascotBubble("Trava-línguas atualizado!");
    } else {
      this.travaLinguas.push(data);
      this.showMascotBubble("Novo trava-línguas adicionado!");
    }
    
    localStorage.setItem('custom_trava_linguas', JSON.stringify(this.travaLinguas));
    this.renderAdminTravaTable();
    document.getElementById('add-trava-form').reset();
    this.switchView(this.currentView);
  }

  editTrava(idx) {
    this.editingTravaIdx = idx;
    const tl = this.travaLinguas[idx];
    document.getElementById('trava-text-input').value = tl.texto;
    document.getElementById('trava-emoji-input').value = tl.emoji;
    
    document.querySelector('#add-trava-form button[type="submit"]').innerText = "Guardar Alterações ✏️";
    document.getElementById('admin-tab-travalinguas').scrollTop = 0;
  }

  deleteTrava(idx) {
    if (confirm("Tens a certeza que desejas apagar este trava-línguas?")) {
      this.travaLinguas.splice(idx, 1);
      localStorage.setItem('custom_trava_linguas', JSON.stringify(this.travaLinguas));
      this.renderAdminTravaTable();
      this.switchView(this.currentView);
      this.showMascotBubble("Trava-línguas eliminado.");
    }
  }

  renderAdminTravaTable() {
    const tbody = document.getElementById('admin-travalinguas-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    this.travaLinguas.forEach((tl, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-size:1.8rem;">${tl.emoji}</td>
        <td><strong>${tl.texto}</strong></td>
        <td>
          <button class="btn-delete" style="background:var(--accent-blue); margin-right:6px;" onclick="app.editTrava(${idx})">Editar</button>
          <button class="btn-delete" onclick="app.deleteTrava(${idx})">Apagar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  handleAddVerb(event) {
    event.preventDefault();
    const text = document.getElementById('verb-text-input').value.trim();
    if (!text) return;
    
    if (this.editingVerbIdx !== null && this.editingVerbIdx !== undefined) {
      this.verbs[this.editingVerbIdx] = text;
      this.editingVerbIdx = null;
      const btn = document.getElementById('submit-verb-btn');
      if (btn) btn.innerText = "Adicionar Verbo";
      this.showMascotBubble("Verbo atualizado!");
    } else {
      this.verbs.push(text);
      this.showMascotBubble("Novo verbo adicionado!");
    }
    
    localStorage.setItem('custom_verbs', JSON.stringify(this.verbs));
    this.renderAdminVerbsTable();
    document.getElementById('add-verb-form').reset();
    this.switchView(this.currentView);
  }

  editVerb(idx) {
    this.editingVerbIdx = idx;
    const verb = this.verbs[idx];
    document.getElementById('verb-text-input').value = verb;
    const btn = document.getElementById('submit-verb-btn');
    if (btn) btn.innerText = "Guardar Alterações ✏️";
    document.getElementById('admin-tab-verbs').scrollTop = 0;
  }

  deleteVerb(idx) {
    if (confirm("Tens a certeza que desejas apagar este verbo?")) {
      this.verbs.splice(idx, 1);
      if (this.editingVerbIdx === idx) {
        this.editingVerbIdx = null;
        const btn = document.getElementById('submit-verb-btn');
        if (btn) btn.innerText = "Adicionar Verbo";
        document.getElementById('add-verb-form').reset();
      } else if (this.editingVerbIdx > idx) {
        this.editingVerbIdx--;
      }
      localStorage.setItem('custom_verbs', JSON.stringify(this.verbs));
      this.renderAdminVerbsTable();
      this.showMascotBubble("Verbo eliminado.");
      this.switchView(this.currentView);
    }
  }

  renderAdminVerbsTable() {
    const tbody = document.getElementById('admin-verbs-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    this.verbs.forEach((verb, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${verb}</strong></td>
        <td>
          <button class="btn-delete" style="background:var(--accent-blue); margin-right:6px;" onclick="app.editVerb(${idx})">Editar</button>
          <button class="btn-delete" onclick="app.deleteVerb(${idx})">Apagar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  handleAddCategory(event) {
    event.preventDefault();
    const name = document.getElementById('category-name-input').value.trim();
    const emoji = document.getElementById('category-emoji-input').value.trim() || '📦';
    if (!name) return;

    const catData = { nome: name, emoji: emoji };

    if (this.editingCategoryIdx !== null && this.editingCategoryIdx !== undefined) {
      const oldName = this.categories[this.editingCategoryIdx].nome;
      this.words.forEach(w => {
        if (w.categoria === oldName) {
          w.categoria = name;
        }
      });
      localStorage.setItem('custom_words', JSON.stringify(this.words));
      
      this.categories[this.editingCategoryIdx] = catData;
      this.editingCategoryIdx = null;
      const btn = document.getElementById('submit-category-btn');
      if (btn) btn.innerText = "Adicionar Categoria";
      this.showMascotBubble("Categoria atualizada!");
    } else {
      const exists = this.categories.some(c => c.nome.toLowerCase() === name.toLowerCase());
      if (exists) {
        alert("Já existe uma categoria com este nome!");
        return;
      }
      this.categories.push(catData);
      this.showMascotBubble("Nova categoria adicionada!");
    }

    localStorage.setItem('custom_categories', JSON.stringify(this.categories));
    this.renderAdminCategoriesTable();
    document.getElementById('add-category-form').reset();
    this.populateCategoriesDropdown();
    this.renderAdminWordsTable();
    this.switchView(this.currentView);
  }

  editCategory(idx) {
    this.editingCategoryIdx = idx;
    const cat = this.categories[idx];
    document.getElementById('category-name-input').value = cat.nome;
    document.getElementById('category-emoji-input').value = cat.emoji;
    const btn = document.getElementById('submit-category-btn');
    if (btn) btn.innerText = "Guardar Alterações ✏️";
    document.getElementById('admin-tab-categories').scrollTop = 0;
  }

  deleteCategory(idx) {
    if (confirm("Tens a certeza que desejas apagar esta categoria?")) {
      const catName = this.categories[idx].nome;
      
      this.categories.splice(idx, 1);
      
      if (this.editingCategoryIdx === idx) {
        this.editingCategoryIdx = null;
        const btn = document.getElementById('submit-category-btn');
        if (btn) btn.innerText = "Adicionar Categoria";
        document.getElementById('add-category-form').reset();
      } else if (this.editingCategoryIdx > idx) {
        this.editingCategoryIdx--;
      }

      let wordsModified = false;
      this.words.forEach(w => {
        if (w.categoria === catName) {
          w.categoria = "Objetos";
          wordsModified = true;
        }
      });
      if (wordsModified) {
        localStorage.setItem('custom_words', JSON.stringify(this.words));
        this.renderAdminWordsTable();
      }

      localStorage.setItem('custom_categories', JSON.stringify(this.categories));
      this.renderAdminCategoriesTable();
      this.populateCategoriesDropdown();
      this.showMascotBubble("Categoria eliminada.");
      this.switchView(this.currentView);
    }
  }

  renderAdminCategoriesTable() {
    const tbody = document.getElementById('admin-categories-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    this.categories.forEach((cat, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-size: 1.8rem;">${cat.emoji}</td>
        <td><strong>${cat.nome}</strong></td>
        <td>
          <button class="btn-delete" style="background:var(--accent-blue); margin-right:6px;" onclick="app.editCategory(${idx})">Editar</button>
          <button class="btn-delete" onclick="app.deleteCategory(${idx})">Apagar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  populateCategoriesDropdown() {
    const select = document.getElementById('category-input');
    if (!select) return;
    
    const allCats = this.categories.map(c => c.nome);
    const currentVal = select.value;
    
    select.innerHTML = allCats.map(cat => `<option value="${cat}">${this.getCategoryEmoji(cat)} ${cat}</option>`).join('') + 
                       `<option value="__NEW__" style="font-weight: bold; color: var(--accent-pink);">+ Nova Categoria...</option>`;
                       
    if (allCats.includes(currentVal)) {
      select.value = currentVal;
    }
  }

  handleCategorySelectChange() {
    const select = document.getElementById('category-input');
    const wrapper = document.getElementById('new-category-wrapper');
    const input = document.getElementById('new-category-input');
    if (!select || !wrapper || !input) return;

    if (select.value === '__NEW__') {
      wrapper.style.display = 'block';
      input.setAttribute('required', 'true');
      input.focus();
    } else {
      wrapper.style.display = 'none';
      input.removeAttribute('required');
    }
  }

  openAdminModal() {
    document.getElementById('admin-modal').classList.add('open');
    this.populateCategoriesDropdown();
    this.switchAdminTab('palavras');
  }

  closeAdminModal() {
    document.getElementById('admin-modal').classList.remove('open');
  }

  // TAB 1: Words
  handleAddWord(event) {
    event.preventDefault();
    const word = document.getElementById('word-input').value.trim();
    const syllables = document.getElementById('syllable-input').value.trim();
    let category = document.getElementById('category-input').value;
    
    if (category === '__NEW__') {
      const newCatInput = document.getElementById('new-category-input');
      const newCatEmojiInput = document.getElementById('new-category-emoji-input');
      const newCat = newCatInput.value.trim();
      const newCatEmoji = newCatEmojiInput ? newCatEmojiInput.value.trim() || '📦' : '📦';
      if (!newCat) {
        alert("Por favor escreva o nome da nova categoria.");
        return;
      }
      category = newCat;
      newCatInput.value = '';
      if (newCatEmojiInput) newCatEmojiInput.value = '';
      document.getElementById('new-category-wrapper').style.display = 'none';

      // Auto-register the new category with the custom emoji if it doesn't exist yet
      const catExists = this.categories.some(c => c.nome.toLowerCase() === category.toLowerCase());
      if (!catExists) {
        this.categories.push({ nome: category, emoji: newCatEmoji });
        localStorage.setItem('custom_categories', JSON.stringify(this.categories));
      }
    }
    
    const phoneme = document.getElementById('phoneme-input').value.trim().toUpperCase();
    const image = document.getElementById('image-input').value.trim();
    const imageX = parseFloat(document.getElementById('image-x').value) || 50;
    const imageY = parseFloat(document.getElementById('image-y').value) || 50;
    const imageZoom = parseFloat(document.getElementById('image-zoom').value) || 100;
    
    const wordData = { palavra: word, silabas: syllables, categoria: category, fonema: phoneme, rima: "", imagem: image, imageX, imageY, imageZoom };
    
    if (this.editingWordIdx !== null) {
      this.words[this.editingWordIdx] = wordData;
      this.editingWordIdx = null;
      document.querySelector('#add-word-form button[type="submit"]').innerText = "Adicionar Palavra";
      this.showMascotBubble("Palavra atualizada!");
    } else {
      this.words.push(wordData);
      this.showMascotBubble("Nova palavra adicionada!");
    }
    
    localStorage.setItem('custom_words', JSON.stringify(this.words));
    this.populateCategoriesDropdown();
    this.renderAdminWordsTable();
    document.getElementById('add-word-form').reset();
    // Reset image editor
    document.getElementById('image-editor-wrapper').style.display = 'none';
    document.getElementById('image-x').value = 50;
    document.getElementById('image-y').value = 50;
    document.getElementById('image-zoom').value = 100;
    document.getElementById('image-zoom-slider').value = 100;
    document.getElementById('image-zoom-label').innerText = '100%';
    this.switchView(this.currentView);
  }

  editWord(idx) {
    this.editingWordIdx = idx;
    const word = this.words[idx];
    document.getElementById('word-input').value = word.palavra;
    document.getElementById('syllable-input').value = word.silabas;
    
    this.populateCategoriesDropdown();
    document.getElementById('category-input').value = word.categoria;
    document.getElementById('new-category-wrapper').style.display = 'none';
    
    document.getElementById('phoneme-input').value = word.fonema;
    document.getElementById('image-input').value = word.imagem;

    // Restore image editor state
    document.getElementById('image-x').value = word.imageX ?? 50;
    document.getElementById('image-y').value = word.imageY ?? 50;
    document.getElementById('image-zoom').value = word.imageZoom ?? 100;
    document.getElementById('image-zoom-slider').value = word.imageZoom ?? 100;
    document.getElementById('image-zoom-label').innerText = `${Math.round(word.imageZoom ?? 100)}%`;
    this.updateImagePreview();
    
    document.querySelector('#add-word-form button[type="submit"]').innerText = "Guardar Alterações ✏️";
    document.getElementById('admin-tab-palavras').scrollTop = 0;
  }

  deleteWord(idx) {
    if (confirm("Tens a certeza que desejas apagar esta palavra?")) {
      this.words.splice(idx, 1);
      localStorage.setItem('custom_words', JSON.stringify(this.words));
      this.renderAdminWordsTable();
      this.switchView(this.currentView);
      this.showMascotBubble("Palavra eliminada.");
    }
  }

  renderAdminWordsTable() {
    const tbody = document.getElementById('admin-words-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    this.words.forEach((word, idx) => {
      const tr = document.createElement('tr');
      const x = word.imageX ?? 50;
      const y = word.imageY ?? 50;
      const zoom = word.imageZoom ?? 100;
      tr.innerHTML = `
        <td><div style="width:60px;height:60px;overflow:hidden;border-radius:10px;border:2px solid #2C2643;">
          <img src="${word.imagem}" alt="Preview" style="width:100%;height:100%;object-fit:cover;object-position:${x}% ${y}%;transform:scale(${zoom/100});transform-origin:${x}% ${y}%;">
        </div></td>
        <td><strong>${word.palavra}</strong></td>
        <td>${word.silabas}</td>
        <td>${this.getCategoryEmoji(word.categoria)} ${word.categoria}</td>
        <td>${word.fonema}</td>
        <td>
          <button class="btn-delete" style="background:var(--accent-blue); margin-right:6px;" onclick="app.editWord(${idx})">Editar</button>
          <button class="btn-delete" onclick="app.deleteWord(${idx})">Apagar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- IMAGE EDITOR (crop/zoom) ---
  // Preview uses the SAME CSS as getImgStyle() used in all games:
  //   object-fit:cover + object-position + transform:scale + transform-origin
  // This guarantees pixel-perfect parity between preview and game display.
  updateImagePreview() {
    const url = document.getElementById('image-input').value.trim();
    const wrapper = document.getElementById('image-editor-wrapper');
    const img = document.getElementById('image-preview-img');
    if (!url) { wrapper.style.display = 'none'; return; }
    wrapper.style.display = 'block';
    img.src = url;
    this._applyImageEditorState();
    this.initImageEditorDrag();
  }

  // Applies the identical CSS formula as getImgStyle() to the preview img
  _applyImageEditorState() {
    const img = document.getElementById('image-preview-img');
    if (!img) return;
    const x = parseFloat(document.getElementById('image-x').value) || 50;
    const y = parseFloat(document.getElementById('image-y').value) || 50;
    const zoom = parseFloat(document.getElementById('image-zoom').value) || 100;
    // These 3 properties are identical to what getImgStyle() returns:
    img.style.objectPosition = `${x}% ${y}%`;
    img.style.transform = `scale(${zoom / 100})`;
    img.style.transformOrigin = `${x}% ${y}%`;
  }

  handleImageZoomChange(val) {
    document.getElementById('image-zoom').value = val;
    document.getElementById('image-zoom-label').innerText = `${Math.round(val)}%`;
    this._applyImageEditorState();
  }

  resetImageEditor() {
    document.getElementById('image-x').value = 50;
    document.getElementById('image-y').value = 50;
    document.getElementById('image-zoom').value = 100;
    document.getElementById('image-zoom-slider').value = 100;
    document.getElementById('image-zoom-label').innerText = '100%';
    this._applyImageEditorState();
  }

  initImageEditorDrag() {
    const box = document.getElementById('image-preview-box');
    if (box._dragBound) return; // Only bind once per open
    box._dragBound = true;
    let dragging = false, startX, startY, startPX, startPY;

    const getXY = (e) => e.touches ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY];

    const onDown = (e) => {
      dragging = true;
      box.style.cursor = 'grabbing';
      [startX, startY] = getXY(e);
      startPX = parseFloat(document.getElementById('image-x').value) || 50;
      startPY = parseFloat(document.getElementById('image-y').value) || 50;
      e.preventDefault();
    };

    const onMove = (e) => {
      if (!dragging) return;
      const [curX, curY] = getXY(e);
      const rect = box.getBoundingClientRect();
      // Dragging across the full width of the box shifts position by 100%
      // Invert direction: dragging left moves the image right (like panning a map)
      const dx = ((startX - curX) / rect.width) * 100;
      const dy = ((startY - curY) / rect.height) * 100;
      const newX = Math.max(0, Math.min(100, startPX + dx));
      const newY = Math.max(0, Math.min(100, startPY + dy));
      document.getElementById('image-x').value = newX;
      document.getElementById('image-y').value = newY;
      this._applyImageEditorState();
      e.preventDefault();
    };

    const onUp = () => { dragging = false; box.style.cursor = 'grab'; };

    box.addEventListener('mousedown', onDown);
    box.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }

  // Returns the inline style used on every game <img> tag.
  // object-fit:cover fills the container; object-position pans the crop;
  // transform:scale zooms in; transform-origin keeps the focal point centred.
  // Parent containers all have overflow:hidden to clip the scaled image.
  getImgStyle(word) {
    const x = word.imageX ?? 50;
    const y = word.imageY ?? 50;
    const zoom = word.imageZoom ?? 100;
    return `object-fit:cover; object-position:${x}% ${y}%; transform:scale(${zoom/100}); transform-origin:${x}% ${y}%;`;
  }

  getCategoryEmoji(category) {
    if (!category) return '📦';
    const cat = this.categories.find(c => c.nome.toLowerCase() === category.toLowerCase());
    return cat ? cat.emoji : '📦';
  }

  // TAB 2: Scenes
  handleAddScene(event) {
    event.preventDefault();
    const name = document.getElementById('scene-name-input').value.trim();
    const bg = document.getElementById('scene-bg-input').value.trim();
    const key = this.editingSceneKey || name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (this.editingSceneKey) {
      this.scenes[key].nome = name;
      this.scenes[key].fundo = bg;
      this.editingSceneKey = null;
      document.querySelector('#add-scene-form button[type="submit"]').innerText = "Criar Cenário";
      this.showMascotBubble("Cenário atualizado!");
    } else {
      if (this.scenes[key]) {
        alert("Cenário já existe com esse nome!");
        return;
      }
      this.scenes[key] = { nome: name, fundo: bg, elementos: [] };
      this.showMascotBubble("Novo cenário criado!");
    }
    
    localStorage.setItem('custom_scenes', JSON.stringify(this.scenes));
    this.renderAdminScenesTable();
    this.populateSceneSelects();
    document.getElementById('add-scene-form').reset();
    this.switchView(this.currentView);
  }

  editScene(key) {
    this.editingSceneKey = key;
    const scene = this.scenes[key];
    document.getElementById('scene-name-input').value = scene.nome;
    document.getElementById('scene-bg-input').value = scene.fundo;
    
    document.querySelector('#add-scene-form button[type="submit"]').innerText = "Guardar Alterações ✏️";
    document.getElementById('admin-tab-cenarios').scrollTop = 0;
  }

  deleteScene(key) {
    if (confirm("Tens a certeza que queres apagar este cenário completo?")) {
      delete this.scenes[key];
      localStorage.setItem('custom_scenes', JSON.stringify(this.scenes));
      this.renderAdminScenesTable();
      this.populateSceneSelects();
      this.switchView(this.currentView);
      this.showMascotBubble("Cenário eliminado.");
    }
  }

  handleAddSceneElement(event) {
    event.preventDefault();
    const sceneKey = document.getElementById('element-scene-select').value;
    const name = document.getElementById('element-name-input').value.trim();
    const img = document.getElementById('element-img-input').value.trim();
    const elementId = 'el_' + Date.now();
    
    if (this.scenes[sceneKey]) {
      this.scenes[sceneKey].elementos.push({ id: elementId, nome: name, img: img });
      localStorage.setItem('custom_scenes', JSON.stringify(this.scenes));
      this.renderAdminScenesTable();
      document.getElementById('add-element-form').reset();
      this.showMascotBubble("Elemento adicionado!");
      this.switchView(this.currentView);
    }
  }

  deleteSceneElement(sceneKey, elementId) {
    if (this.scenes[sceneKey]) {
      this.scenes[sceneKey].elementos = this.scenes[sceneKey].elementos.filter(el => el.id !== elementId);
      localStorage.setItem('custom_scenes', JSON.stringify(this.scenes));
      this.renderAdminScenesTable();
      this.switchView(this.currentView);
    }
  }

  renderAdminScenesTable() {
    const tbody = document.getElementById('admin-scenes-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    Object.keys(this.scenes).forEach(key => {
      const scene = this.scenes[key];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${scene.fundo}" alt="Preview Fundo"></td>
        <td><strong>${scene.nome}</strong></td>
        <td>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${scene.elementos.map(el => `
              <div style="background:var(--primary-light); padding:4px 8px; border-radius:12px; font-size:0.8rem; display:flex; align-items:center; gap:4px; border:1px solid #2C2643;">
                ${el.nome}
                <span style="color:var(--accent-pink); cursor:pointer; font-weight:800;" onclick="app.deleteSceneElement('${key}', '${el.id}')">×</span>
              </div>
            `).join('')}
          </div>
        </td>
        <td>
          <button class="btn-delete" style="background:var(--accent-blue); margin-right:6px;" onclick="app.editScene('${key}')">Editar</button>
          <button class="btn-delete" onclick="app.deleteScene('${key}')">Apagar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  populateSceneSelects() {
    const select = document.getElementById('element-scene-select');
    if (!select) return;
    select.innerHTML = Object.keys(this.scenes).map(key => `
      <option value="${key}">${this.scenes[key].nome}</option>
    `).join('');
  }

  // TAB 3: Caretas
  handleAddCareta(event) {
    event.preventDefault();
    const text = document.getElementById('careta-text-input').value.trim();
    const emoji = document.getElementById('careta-emoji-input').value.trim();
    
    const data = { texto: text, emoji: emoji };
    
    if (this.editingCaretaIdx !== null) {
      this.caretaActions[this.editingCaretaIdx] = data;
      this.editingCaretaIdx = null;
      document.querySelector('#add-careta-form button[type="submit"]').innerText = "Adicionar à Roleta";
      this.showMascotBubble("Careta atualizada!");
    } else {
      this.caretaActions.push(data);
      this.showMascotBubble("Nova careta adicionada!");
    }
    
    localStorage.setItem('custom_caretas', JSON.stringify(this.caretaActions));
    this.renderAdminCaretasTable();
    document.getElementById('add-careta-form').reset();
    this.switchView(this.currentView);
  }

  editCareta(idx) {
    this.editingCaretaIdx = idx;
    const action = this.caretaActions[idx];
    document.getElementById('careta-text-input').value = action.texto;
    document.getElementById('careta-emoji-input').value = action.emoji;
    
    document.querySelector('#add-careta-form button[type="submit"]').innerText = "Guardar Alterações ✏️";
    document.getElementById('admin-tab-caretas').scrollTop = 0;
  }

  deleteCareta(idx) {
    if (confirm("Tens a certeza que queres apagar este item da roleta?")) {
      this.caretaActions.splice(idx, 1);
      localStorage.setItem('custom_caretas', JSON.stringify(this.caretaActions));
      this.renderAdminCaretasTable();
      this.switchView(this.currentView);
      this.showMascotBubble("Careta eliminada.");
    }
  }

  renderAdminCaretasTable() {
    const tbody = document.getElementById('admin-caretas-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    this.caretaActions.forEach((action, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-size:1.8rem;">${action.emoji}</td>
        <td><strong>${action.texto}</strong></td>
        <td>
          <button class="btn-delete" style="background:var(--accent-blue); margin-right:6px;" onclick="app.editCareta(${idx})">Editar</button>
          <button class="btn-delete" onclick="app.deleteCareta(${idx})">Apagar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // TAB 4: Stories
  handleAddStory(event) {
    event.preventDefault();
    const name = document.getElementById('story-name-input').value.trim();
    
    const s1Text = document.getElementById('story-step1-text').value.trim();
    const s1Img = document.getElementById('story-step1-img').value.trim();
    
    const s2Text = document.getElementById('story-step2-text').value.trim();
    const s2Img = document.getElementById('story-step2-img').value.trim();
    
    const s3Text = document.getElementById('story-step3-text').value.trim();
    const s3Img = document.getElementById('story-step3-img').value.trim();
    
    const storyData = {
      nome: name,
      etapas: [
        { ordem: 1, texto: s1Text, imagem: s1Img },
        { ordem: 2, texto: s2Text, imagem: s2Img },
        { ordem: 3, texto: s3Text, imagem: s3Img }
      ]
    };
    
    if (this.editingStoryIdx !== null) {
      this.sequences[this.editingStoryIdx] = storyData;
      this.editingStoryIdx = null;
      document.querySelector('#add-story-form button[type="submit"]').innerText = "Criar História";
      this.showMascotBubble("História atualizada!");
    } else {
      this.sequences.push(storyData);
      this.showMascotBubble("Nova história criada!");
    }
    
    localStorage.setItem('custom_sequences', JSON.stringify(this.sequences));
    this.renderAdminStoriesTable();
    document.getElementById('add-story-form').reset();
    this.switchView(this.currentView);
  }

  editStory(idx) {
    this.editingStoryIdx = idx;
    const seq = this.sequences[idx];
    document.getElementById('story-name-input').value = seq.nome;
    
    document.getElementById('story-step1-text').value = seq.etapas[0].texto;
    document.getElementById('story-step1-img').value = seq.etapas[0].imagem;
    
    document.getElementById('story-step2-text').value = seq.etapas[1].texto;
    document.getElementById('story-step2-img').value = seq.etapas[1].imagem;
    
    document.getElementById('story-step3-text').value = seq.etapas[2].texto;
    document.getElementById('story-step3-img').value = seq.etapas[2].imagem;
    
    document.querySelector('#add-story-form button[type="submit"]').innerText = "Guardar Alterações ✏️";
    document.getElementById('admin-tab-historias').scrollTop = 0;
  }

  deleteStory(idx) {
    if (confirm("Tens a certeza que desejas apagar esta história?")) {
      this.sequences.splice(idx, 1);
      localStorage.setItem('custom_sequences', JSON.stringify(this.sequences));
      this.renderAdminStoriesTable();
      this.switchView(this.currentView);
      this.showMascotBubble("História eliminada.");
    }
  }

  renderAdminStoriesTable() {
    const tbody = document.getElementById('admin-stories-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    this.sequences.forEach((seq, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${seq.nome}</strong></td>
        <td>
          <div style="display:flex; gap:8px;">
            ${seq.etapas.map(et => `<img src="${et.imagem}" style="width:36px; height:36px; object-fit:cover; border-radius:4px; border:1px solid #2C2643;">`).join('')}
          </div>
        </td>
        <td>
          <button class="btn-delete" style="background:var(--accent-blue); margin-right:6px;" onclick="app.editStory(${idx})">Editar</button>
          <button class="btn-delete" onclick="app.deleteStory(${idx})">Apagar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- UTILS & SHUFFLE ---
  shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  getRandomAvoidingRecent(array, maxHistorySize = 10) {
    if (!array || array.length === 0) return null;
    let candidates = array.filter(item => {
      const val = typeof item === 'object' ? item.palavra : item;
      return !this.recentWordsHistory.includes(val);
    });
    if (candidates.length === 0) {
      candidates = array;
    }
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    const val = typeof picked === 'object' ? picked.palavra : picked;
    this.recentWordsHistory.push(val);
    if (this.recentWordsHistory.length > maxHistorySize) {
      this.recentWordsHistory.shift();
    }
    return picked;
  }

  getRandomAvoidingRecentCategory(validCategories) {
    if (!this.recentCategories) this.recentCategories = [];
    let candidates = validCategories.filter(cat => !this.recentCategories.includes(cat));
    if (candidates.length === 0) candidates = validCategories;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    this.recentCategories.push(picked);
    if (this.recentCategories.length > 3) this.recentCategories.shift();
    return picked;
  }

  getRandomAvoidingRecentSequence(sequencesArray, maxHistorySize = 3) {
    if (!sequencesArray || sequencesArray.length === 0) return null;
    let candidates = sequencesArray.filter(seq => !this.recentSequencesHistory.includes(seq.nome));
    if (candidates.length === 0) candidates = sequencesArray;
    const picked = candidates[Math.floor(Math.random() * candidates.length)];
    this.recentSequencesHistory.push(picked.nome);
    if (this.recentSequencesHistory.length > maxHistorySize) {
      this.recentSequencesHistory.shift();
    }
    return picked;
  }

  shuffleWordsAvoidingRecent(wordsArray) {
    const nonRecent = this.shuffle(wordsArray.filter(w => !this.recentWordsHistory.includes(w.palavra)));
    const recent = this.shuffle(wordsArray.filter(w => this.recentWordsHistory.includes(w.palavra)));
    return [...nonRecent, ...recent];
  }

  triggerCelebration(callback) {
    const overlay = document.getElementById('celebration-overlay');
    if (overlay) overlay.classList.add('active');
    
    const colors = ['#f78da7', '#6de2c1', '#7bcbf5', '#f8cf61', '#8a70f5'];
    for (let i = 0; i < 40; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'celebration-confetti';
      confetti.style.left = `${Math.random() * 100}vw`;
      confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDelay = `${Math.random() * 0.5}s`;
      confetti.style.width = `${Math.random() * 8 + 8}px`;
      confetti.style.height = `${Math.random() * 15 + 10}px`;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 2500);
    }
    
    setTimeout(() => {
      if (overlay) overlay.classList.remove('active');
      if (callback) callback();
    }, 2000);
  }

  // --- DATABASE EXPORT & IMPORT ---
  exportDatabase() {
    // Generate a new timestamp to ensure export file is always fresh and marked as newer on other devices
    const exportTime = Date.now();
    localStorage.setItem('custom_db_last_updated', exportTime.toString());
    
    const exportData = {
      lastUpdated: exportTime,
      words: this.words,
      categories: this.categories,
      caretas: this.caretaActions,
      scenes: this.scenes,
      sequences: this.sequences,
      trava_linguas: this.travaLinguas,
      verbs: this.verbs
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "db.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showMascotBubble("Base de dados exportada! 📥");
  }

  triggerImportDatabase() {
    const fileInput = document.getElementById('admin-import-file');
    if (fileInput) fileInput.click();
  }

  importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validation
        if (!data.words || !data.caretas || !data.scenes || !data.sequences || !data.trava_linguas) {
          throw new Error("Formato do ficheiro inválido. Certifique-se que o JSON contém todas as chaves corretas.");
        }
        
        this.isInitializing = true;
        
        // Sync memory
        this.words = data.words;
        this.categories = data.categories || [];
        this.caretaActions = data.caretas;
        this.scenes = data.scenes;
        this.sequences = data.sequences;
        this.travaLinguas = data.trava_linguas;
        if (data.verbs) this.verbs = data.verbs;
        
        const importTime = data.lastUpdated || Date.now();
        
        // Sync local storage
        localStorage.setItem('custom_words', JSON.stringify(this.words));
        localStorage.setItem('custom_categories', JSON.stringify(this.categories));
        localStorage.setItem('custom_caretas', JSON.stringify(this.caretaActions));
        localStorage.setItem('custom_scenes', JSON.stringify(this.scenes));
        localStorage.setItem('custom_sequences', JSON.stringify(this.sequences));
        localStorage.setItem('custom_trava_linguas', JSON.stringify(this.travaLinguas));
        localStorage.setItem('custom_verbs', JSON.stringify(this.verbs));
        localStorage.setItem('custom_db_last_updated', importTime.toString());
        localStorage.setItem('app_initialised_v2', 'true');
        
        this.isInitializing = false;
        
        // Refresh UI
        this.switchAdminTab('palavras');
        this.switchView(this.currentView);
        this.showMascotBubble("Base de dados importada com sucesso! 📤");
      } catch (err) {
        this.isInitializing = false;
        alert("Erro ao importar base de dados: " + err.message);
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  }

  // --- JOGO: FLASHCARDS DE VOCABULÁRIO ---
  initFlashcardsGame(container) {
    if (this.words.length < 4) {
      container.innerHTML = `<p style="text-align:center;padding:40px;">Adiciona pelo menos 4 palavras no Painel Administrativo para jogar.</p>`;
      return;
    }

    const shuffledWords = this.shuffle([...this.words]);
    const target = shuffledWords[0];
    const distractors = shuffledWords.slice(1, 4);
    const choices = this.shuffle([target, ...distractors]);

    container.innerHTML = `
      <div class="flashcard-layout">
        <div class="flashcard-question">
          <span class="flashcard-question-label">Qual é a imagem de:</span>
          <span class="flashcard-question-word">${target.palavra}</span>
        </div>
        <div class="flashcard-grid">
          ${choices.map((w, idx) => `
            <div class="flashcard-choice ${w.palavra === target.palavra ? 'correct-choice' : ''}" 
                 id="fc-choice-${idx}" 
                 data-chosen="${w.imagem}" 
                 data-correct="${target.imagem}"
                 onclick="app.handleFlashcardChoice(this)">
              <div class="square-img-wrapper" style="width: 100%; aspect-ratio: 1; border: none;">
                <img src="${w.imagem}" alt="${w.palavra}" style="${app.getImgStyle(w)}">
              </div>
              <span>${w.palavra}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.showMascotBubble(`Encontra a imagem de "${target.palavra}"!`);
  }

  handleFlashcardChoice(el) {
    if (el.classList.contains('fc-disabled')) return;
    document.querySelectorAll('.flashcard-choice').forEach(c => c.classList.add('fc-disabled'));

    const chosen = el.getAttribute('data-chosen');
    const correct = el.getAttribute('data-correct');

    if (chosen === correct) {
      el.classList.add('fc-correct');
      this.addStar();
      this.triggerCelebration(() => this.initFlashcardsGame(document.getElementById('game-card-container')));
    } else {
      el.classList.add('fc-wrong');
      document.querySelector('.correct-choice').classList.add('fc-reveal');
      this.showMascotBubble('Tenta outra vez! 💪');
      setTimeout(() => this.initFlashcardsGame(document.getElementById('game-card-container')), 2000);
    }
  }

  // --- JOGO 12: CAÇA AOS SONS ---
  initCacaSonsGame(container) {
    if (this.words.length < 3) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Por favor adicione mais palavras no Painel Administrativo para jogar.</p>`;
      return;
    }
    
    // Pick a target word with a phoneme
    const wordsWithPhoneme = this.words.filter(w => w.fonema && w.fonema.trim() !== '');
    if (wordsWithPhoneme.length === 0) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Por favor adicione palavras com fonemas associados para jogar.</p>`;
      return;
    }
    
    const target = this.getRandomAvoidingRecent(wordsWithPhoneme);
    const distractors = this.shuffle(this.words.filter(w => w.fonema !== target.fonema)).slice(0, 2);
    const choices = this.shuffle([target, ...distractors]);
    
    container.innerHTML = `
      <div class="caca-sons-container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:20px; width:100%; height:100%; box-sizing:border-box;">
        
        <div style="font-size: 2.2rem; font-weight: 950; color: var(--accent-pink); background: rgba(247, 141, 167, 0.1); border: 3.5px solid var(--accent-pink); border-radius: 24px; padding: 14px 40px; text-align: center; box-shadow: 0 5px 0 #2C2643; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
          Fonema: "${target.fonema}"
        </div>
        
        <!-- Visual choices for child -->
        <div class="caca-sons-choices-column" style="display:flex; flex-direction:column; align-items:center; gap: 20px; width: 100%; flex-grow:1; justify-content:center;">
          <div class="caca-sons-grid" style="display: flex; gap: min(24px, 3vh); width: 100%; justify-content: center;">
            ${choices.map((w, idx) => `
              <div class="caca-sons-card ${w.palavra === target.palavra ? 'caca-correct-card' : ''}" 
                   id="caca-choice-${idx}" 
                   onclick="app.cacaSonsChoose(this, ${w.palavra === target.palavra})">
                <div class="square-img-wrapper" style="width: 100%; aspect-ratio: 1; border: none; margin-bottom: 8px;">
                  <img src="${w.imagem}" alt="${w.palavra}" style="${app.getImgStyle(w)}">
                </div>
                <span>${w.palavra}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    this.showMascotBubble("Ouve o som do terapeuta e escolhe a imagem certa!");
  }

  cacaSonsChoose(el, isCorrect) {
    if (document.querySelector('.caca-disabled')) return;
    document.querySelectorAll('.caca-sons-card').forEach(c => c.classList.add('caca-disabled'));
    
    if (isCorrect) {
      el.classList.add('caca-sons-success');
      this.addStar();
      this.triggerCelebration(() => this.initCacaSonsGame(document.getElementById('game-card-container')));
    } else {
      el.classList.add('caca-sons-failure');
      const correctCard = document.querySelector('.caca-correct-card');
      if (correctCard) correctCard.classList.add('caca-sons-reveal');
      this.showMascotBubble("Tenta outra vez! 🧐");
      setTimeout(() => this.initCacaSonsGame(document.getElementById('game-card-container')), 2000);
    }
  }

  // --- JOGO 13: CONSTRUTOR DE FRASES ---
  initConstrutorFrasesGame(container) {
    if (this.words.length < 3) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Adicione mais palavras para poder construir frases.</p>`;
      return;
    }
    const currentVerbs = this.verbs.length > 0 ? this.verbs : ["come 🍽️", "corre para 🏃", "bebe 🥛", "salta sobre 🤸", "voa em 🪽", "dorme na 💤", "brinca com 🧸"];
    
    const subjects = this.shuffle(this.words).slice(0, 3);
    const verbsList = this.shuffle(currentVerbs).slice(0, 3);
    const objects = this.shuffle(this.words).slice(0, 3);
    
    this.phraseState = { subject: null, verb: null, object: null };
    
    container.innerHTML = `
      <div class="phrase-constructor-container" style="display:flex; flex-direction:column; align-items:center; width:100%; height:100%; justify-content:space-between; box-sizing:border-box;">
        <h4 style="font-size: 1.25rem; font-weight: 800; color: var(--primary-dark); margin: 0 0 10px 0; text-align: center;">
          Cria uma frase divertida escolhendo uma carta de cada linha!
        </h4>
        
        <div class="phrase-rows-container">
          
          <!-- Row 1: Subjects -->
          <div class="phrase-row-line">
            <div class="phrase-row-title" style="background: var(--accent-blue);">Quem?</div>
            <div class="phrase-row-cards">
              ${subjects.map((w, idx) => `
                <div class="phrase-card" data-type="subject" data-value="${w.palavra}" onclick="app.selectPhraseCard(this)">
                  <div class="square-img-wrapper" style="width: 100%; aspect-ratio: 1; border: none; margin-bottom: 4px; position: relative;">
                    <img src="${w.imagem}" alt="${w.palavra}" style="${app.getImgStyle(w)}">
                  </div>
                  <span>${w.palavra}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Row 2: Verbs -->
          <div class="phrase-row-line">
            <div class="phrase-row-title" style="background: var(--accent-pink);">Ação?</div>
            <div class="phrase-row-cards">
              ${verbsList.map((verb, idx) => `
                <div class="phrase-card verb-card" data-type="verb" data-value="${verb}" onclick="app.selectPhraseCard(this)">
                  <div style="font-size: 2rem; margin-bottom:2px; line-height:1;">${verb.split(' ').pop()}</div>
                  <span style="font-size: 1.1rem; font-weight:900;">${verb.substring(0, verb.lastIndexOf(' ')) || verb}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Row 3: Objects -->
          <div class="phrase-row-line">
            <div class="phrase-row-title" style="background: var(--accent-purple);">O quê?</div>
            <div class="phrase-row-cards">
              ${objects.map((w, idx) => `
                <div class="phrase-card" data-type="object" data-value="${w.palavra}" onclick="app.selectPhraseCard(this)">
                  <div class="square-img-wrapper" style="width: 100%; aspect-ratio: 1; border: none; margin-bottom: 4px; position: relative;">
                    <img src="${w.imagem}" alt="${w.palavra}" style="${app.getImgStyle(w)}">
                  </div>
                  <span>${w.palavra}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
        </div>
        
        <!-- Result Sentence Bar -->
        <div id="phrase-result-bar" class="phrase-result-panel" style="display:none; width:100%; max-width:700px; margin-top:10px;">
          <button class="btn-action" style="background:var(--accent-mint); color:white; font-size:1.3rem; padding:12px 40px; margin: 0; flex-shrink:0;" onclick="app.completePhrase()">Dizer Frase! 🗣️</button>
        </div>
      </div>
    `;
    
    this.showMascotBubble("Escolhe uma carta de cada linha!");
  }

  selectPhraseCard(el) {
    const type = el.getAttribute('data-type');
    const val = el.getAttribute('data-value');
    
    // Deselect others in the same column
    el.parentNode.querySelectorAll('.phrase-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    
    this.phraseState[type] = val;
    
    if (this.phraseState.subject && this.phraseState.verb && this.phraseState.object) {
      const resultBar = document.getElementById('phrase-result-bar');
      resultBar.style.display = 'flex';
      this.showMascotBubble("Agora diz a frase em voz alta e clica no botão! 🗣️");
    }
  }

  completePhrase() {
    this.addStar();
    this.triggerCelebration(() => this.initConstrutorFrasesGame(document.getElementById('game-card-container')));
  }

  // --- JOGO 14: CORRIDA DE CARROS ---
  initCorridaCarrosGame(container) {
    if (this.words.length < 3) {
      container.innerHTML = `<p style="text-align:center; padding:40px;">Por favor adicione mais palavras para poder realizar corridas.</p>`;
      return;
    }
    
    this.raceState = {
      playerStep: 0,
      dinoStep: 0,
      currentQuestion: null,
      buttonsDisabled: false
    };
    
    container.innerHTML = `
      <div class="race-game-layout">
        <!-- Horizontal Asphalt Road Track -->
        <div class="race-track-wrapper">
          <div class="race-track-divider"></div>
          <div class="race-start-line-rect"></div>
          <div class="race-finish-line-rect"></div>
          <div class="race-lane-label race-lane-1-label">Tu 🏎️</div>
          <div class="race-lane-label race-lane-2-label">Dino 🦕</div>
          
          <!-- Cars (Lanes horizontal top/bottom) -->
          <div class="race-car player-car" id="race-player-car" style="left: 5%; top: 25%;">🏎️</div>
          <div class="race-car dino-car" id="race-dino-car" style="left: 5%; top: 75%;">🦕</div>
        </div>
        
        <!-- Quiz Area below track -->
        <div class="race-quiz-container" id="race-infield-content">
          <!-- Questions loaded here dynamically -->
        </div>
      </div>
    `;
    
    this.loadNextRaceQuestion();
    this.showMascotBubble("Chegou a hora da corrida! Responde corretamente para acelerar! 🏎️💨");
  }

  loadNextRaceQuestion() {
    this.raceState.buttonsDisabled = false;
    const infield = document.getElementById('race-infield-content');
    if (!infield) return;
    
    // Randomly select question type (1: Syllables, 2: Start Letter, 3: Image Match)
    const types = [1, 2, 3];
    const qType = types[Math.floor(Math.random() * types.length)];
    const word = this.getRandomAvoidingRecent(this.words);
    
    let html = '';
    
    if (qType === 1) {
      // Syllable Count
      const count = word.silabas.split('-').length;
      this.raceState.currentQuestion = { type: 1, correct: count };
      
      html = `
        <div class="race-question-card">
          <span class="race-q-title">Quantas sílabas? 🚂</span>
          <div class="square-img-wrapper" style="width: min(240px, 28vh); aspect-ratio: 1; border: none; margin-bottom: 4px; position: relative;">
            <img src="${word.imagem}" alt="${word.palavra}" style="${app.getImgStyle(word)}">
          </div>
          <span class="race-q-word">${word.palavra}</span>
          <div class="race-q-options">
            ${[1, 2, 3, 4].map(num => `
              <button class="race-btn" onclick="app.submitRaceAnswer(${num})">${num}</button>
            `).join('')}
          </div>
        </div>
      `;
    } else if (qType === 2) {
      // Initial Letter match
      const startLetter = word.palavra.substring(0, 1).toUpperCase();
      const isYes = Math.random() > 0.5;
      const shownLetter = isYes ? startLetter : 'BCDFGHJLMNPRSTVXZ'.replace(startLetter, '')[0];
      this.raceState.currentQuestion = { type: 2, correct: isYes ? 'Sim' : 'Não' };
      
      html = `
        <div class="race-question-card">
          <span class="race-q-title">Começa com a letra ${shownLetter}? 👄</span>
          <div class="square-img-wrapper" style="width: min(240px, 28vh); aspect-ratio: 1; border: none; margin-bottom: 4px; position: relative;">
            <img src="${word.imagem}" alt="${word.palavra}" style="${app.getImgStyle(word)}">
          </div>
          <span class="race-q-word">${word.palavra}</span>
          <div class="race-q-options" style="grid-template-columns: repeat(2, 1fr); margin-top: 10px;">
            <button class="race-btn yes-btn" onclick="app.submitRaceAnswer('Sim')">Sim</button>
            <button class="race-btn no-btn" onclick="app.submitRaceAnswer('Não')">Não</button>
          </div>
        </div>
      `;
    } else {
      // Find the correct image
      const distractors = this.shuffle(this.words.filter(w => w.palavra !== word.palavra)).slice(0, 2);
      const choices = this.shuffle([word, ...distractors]);
      this.raceState.currentQuestion = { type: 3, correct: word.palavra };
      
      html = `
        <div class="race-question-card">
          <span class="race-q-title">Qual é a imagem correta? 🕵️</span>
          <span class="race-q-word" style="font-size: 1.8rem; color: var(--accent-purple); margin-bottom: 4px;">${word.palavra.toUpperCase()}</span>
          <div class="race-q-image-options" style="display:flex; gap:16px; width:100%; justify-content:center;">
            ${choices.map((w, idx) => `
              <div class="race-image-choice-card" onclick="app.submitRaceAnswer('${w.palavra}')">
                <div class="square-img-wrapper" style="width: 100%; aspect-ratio: 1; border: none;">
                  <img src="${w.imagem}" alt="${w.palavra}" style="${app.getImgStyle(w)}">
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    infield.innerHTML = html;
  }

  submitRaceAnswer(answer) {
    if (this.raceState.buttonsDisabled) return;
    this.raceState.buttonsDisabled = true;
    
    const isCorrect = answer === this.raceState.currentQuestion.correct;
    const infield = document.getElementById('race-infield-content');
    
    if (isCorrect) {
      this.raceState.playerStep++;
      infield.innerHTML = `
        <div class="race-feedback-card correct">
          <span style="font-size: 4rem;">🏎️💨</span>
          <h3>Muito bem! Aceleras-te!</h3>
        </div>
      `;
      this.moveRaceCars();
      this.addStar();
      
      setTimeout(() => {
        if (this.raceState.playerStep >= 5) {
          this.endRaceGame(true);
        } else {
          this.loadNextRaceQuestion();
        }
      }, 1500);
    } else {
      this.raceState.dinoStep++;
      infield.innerHTML = `
        <div class="race-feedback-card wrong">
          <span style="font-size: 4rem;">🦖💨</span>
          <h3>Ups! O Dinossauro ultrapassou-te!</h3>
        </div>
      `;
      this.moveRaceCars();
      
      setTimeout(() => {
        if (this.raceState.dinoStep >= 5) {
          this.endRaceGame(false);
        } else {
          this.loadNextRaceQuestion();
        }
      }, 1500);
    }
  }

  moveRaceCars() {
    const pCar = document.getElementById('race-player-car');
    const dCar = document.getElementById('race-dino-car');
    
    const pStep = Math.min(this.raceState.playerStep, 5);
    const dStep = Math.min(this.raceState.dinoStep, 5);
    
    if (pCar) {
      // 5% (start) to 90% (finish)
      pCar.style.left = `${5 + pStep * 17}%`;
    }
    if (dCar) {
      dCar.style.left = `${5 + dStep * 17}%`;
    }
  }

  endRaceGame(playerWon) {
    const infield = document.getElementById('race-infield-content');
    if (!infield) return;
    
    if (playerWon) {
      infield.innerHTML = `
        <div class="race-feedback-card correct">
          <span style="font-size: 5rem;">🏆🏆</span>
          <h2>Vencedor da Corrida!</h2>
          <button class="btn-action" style="margin-top: 15px;" onclick="app.initCorridaCarrosGame(document.getElementById('game-card-container'))">Correr de Novo 🏎️</button>
        </div>
      `;
      this.showMascotBubble("Ganhaste a corrida! Parabéns! 🏆🏆");
      this.triggerCelebration();
    } else {
      infield.innerHTML = `
        <div class="race-feedback-card wrong">
          <span style="font-size: 5rem;">🦕🥇</span>
          <h2>O Dinossauro ganhou!</h2>
          <button class="btn-action" style="margin-top: 15px;" onclick="app.initCorridaCarrosGame(document.getElementById('game-card-container'))">Tentar de Novo 🏎️</button>
        </div>
      `;
      this.showMascotBubble("O Dinossauro venceu desta vez. Tenta de novo! 🦖");
    }
  }
}

// Instantiate App
window.app = new SpeechTherapyApp();
