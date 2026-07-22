/* ============================================================
   SIMULADO CONCURSO TI - MOTOR DA APLICAÇÃO (APP.JS)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------------------------------
    // ESTADO DA APLICAÇÃO
    // ------------------------------------------------------------
    let modoAtual = 'oficial';
    let materiaSelecionada = 'todas';
    let bancoCompleto = [];
    let questoesAtuais = [];
    let indiceAtual = 0;
    let respostas = [];
    let verificadas = [];
    let acertos = 0;
    let erros = 0;
    let pontuacao = 0;
    let finalizado = false;
    let timerInterval = null;
    let segundosDecorridos = 0;

    // ------------------------------------------------------------
    // ELEMENTOS DA DOM
    // ------------------------------------------------------------
    const btnThemeToggle = document.getElementById('btnThemeToggle');
    const btnHistoryToggle = document.getElementById('btnHistoryToggle');
    const modeBtnOficial = document.getElementById('modeBtnOficial');
    const modeBtnMateria = document.getElementById('modeBtnMateria');
    const materiaSelectContainer = document.getElementById('materiaSelectContainer');
    const materiaSelect = document.getElementById('materiaSelect');

    const perguntaEl = document.getElementById('pergunta');
    const categoriaBadgeEl = document.getElementById('categoriaBadge');
    const opcoesContainer = document.getElementById('opcoesContainer');
    const feedbackEl = document.getElementById('feedback');

    const numAtualEl = document.getElementById('numAtual');
    const totalQuestoesEl = document.getElementById('totalQuestoes');
    const acertosEl = document.getElementById('acertos');
    const errosEl = document.getElementById('erros');
    const pontuacaoEl = document.getElementById('pontuacao');
    const restantesEl = document.getElementById('restantes');
    const timerDisplayEl = document.getElementById('timerDisplay');
    const progressFill = document.getElementById('progressFill');

    const btnAnterior = document.getElementById('btnAnterior');
    const btnProxima = document.getElementById('btnProxima');
    const btnVerificar = document.getElementById('btnVerificar');
    const btnFinalizar = document.getElementById('btnFinalizar');

    const questaoArea = document.getElementById('questaoArea');
    const resultadoDiv = document.getElementById('resultado');
    const appContainer = document.getElementById('app');

    const modalHistorico = document.getElementById('modalHistorico');
    const btnFecharHistorico = document.getElementById('btnFecharHistorico');
    const btnLimparHistorico = document.getElementById('btnLimparHistorico');
    const historicoLista = document.getElementById('historicoLista');

    // Splash & Modal Finalizar
    const splashScreen = document.getElementById('splashScreen');
    const btnIniciarApp = document.getElementById('btnIniciarApp');
    const modalFinalizar = document.getElementById('modalFinalizar');
    const btnCancelarFinalizar = document.getElementById('btnCancelarFinalizar');
    const btnConfirmarFinalizar = document.getElementById('btnConfirmarFinalizar');
    const modalFinalizarSub = document.getElementById('modalFinalizarSub');
    const mfAcertos = document.getElementById('mfAcertos');
    const mfErros = document.getElementById('mfErros');
    const mfPendentes = document.getElementById('mfPendentes');

    // ------------------------------------------------------------
    // STORAGE & TEMA
    // ------------------------------------------------------------
    const SimuladoStorage = window.SimuladoStorage || {
        getTheme: () => 'light',
        setTheme: () => {},
        saveResult: () => {},
        getHistory: () => [],
        clearHistory: () => {}
    };

    const currentTheme = SimuladoStorage.getTheme();
    SimuladoStorage.setTheme(currentTheme);
    if (btnThemeToggle) btnThemeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

    // ------------------------------------------------------------
    // SPLASH SCREEN — esconder ao clicar em Iniciar
    // ------------------------------------------------------------
    function fecharSplash() {
        splashScreen.classList.add('fade-out');
        splashScreen.addEventListener('transitionend', () => {
            splashScreen.style.display = 'none';
            appContainer.style.display = 'block';
        }, { once: true });
    }

    if (btnIniciarApp) {
        btnIniciarApp.addEventListener('click', () => {
            iniciarNovoSimulado();
            fecharSplash();
        });
    }

    // ------------------------------------------------------------
    // BANCO DE QUESTÕES
    // ------------------------------------------------------------
    function montarBancoUnificado() {
        const banco = window.bancoDadosQuestoes || {};
        const portugues = banco.portugues || [];
        const matematica = banco.matematica || [];
        const administracao = banco.administracao || [];
        const ti = banco.ti || [];

        let unificado = [...portugues, ...matematica, ...administracao, ...ti];

        const seen = new Set();
        unificado = unificado.filter(q => {
            if (!q || !q.p) return false;
            const key = q.p.substring(0, 60);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        bancoCompleto = unificado.map(q => {
            const shuffled = window.shuffleOptions ? window.shuffleOptions(q) : { o: q.o, c: q.c };
            return { ...q, o: shuffled.o, c: shuffled.c };
        });
    }

    montarBancoUnificado();

    // ------------------------------------------------------------
    // UTILITÁRIOS
    // ------------------------------------------------------------
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function formatarTempo(s) {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const seg = (s % 60).toString().padStart(2, '0');
        return m + ':' + seg;
    }

    function getNomeArea(area) {
        const nomes = {
            portugues: 'Língua Portuguesa',
            matematica: 'Matemática e Raciocínio Lógico',
            administracao: 'Administração / Legislação / Gov Digital',
            ti: 'Conhecimentos Específicos (TI)'
        };
        return nomes[area] || (area ? area.toUpperCase() : 'GERAL');
    }

    // ------------------------------------------------------------
    // CRONÔMETRO
    // ------------------------------------------------------------
    function iniciarTimer() {
        pararTimer();
        segundosDecorridos = 0;
        if (timerDisplayEl) timerDisplayEl.textContent = '00:00';
        timerInterval = setInterval(() => {
            segundosDecorridos++;
            if (timerDisplayEl) timerDisplayEl.textContent = formatarTempo(segundosDecorridos);
        }, 1000);
    }

    function pararTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    // ------------------------------------------------------------
    // ATUALIZAR PAINEL (contador, botões)
    // ------------------------------------------------------------
    function atualizarPainel() {
        const total = questoesAtuais.length;
        if (total === 0) return;

        const respondidas = verificadas.filter(Boolean).length;

        numAtualEl.textContent = indiceAtual + 1;
        totalQuestoesEl.textContent = total;
        acertosEl.textContent = acertos;
        errosEl.textContent = erros;
        pontuacaoEl.textContent = pontuacao;
        if (restantesEl) restantesEl.textContent = total - respondidas;
        progressFill.style.width = ((indiceAtual + 1) / total * 100) + '%';

        btnAnterior.disabled = (indiceAtual === 0);
        btnProxima.disabled = (indiceAtual >= total - 1);
        btnVerificar.disabled = (respostas[indiceAtual] === null || !!verificadas[indiceAtual]);
    }

    // ------------------------------------------------------------
    // MOTOR DO SIMULADO
    // ------------------------------------------------------------
    function iniciarNovoSimulado() {
        let selecionadas = [];

        if (modoAtual === 'oficial') {
            const areas = { portugues: [], matematica: [], administracao: [], ti: [] };
            bancoCompleto.forEach(q => {
                if (areas[q.area]) areas[q.area].push(q);
            });
            shuffleArray(areas.portugues);
            shuffleArray(areas.matematica);
            shuffleArray(areas.administracao);
            shuffleArray(areas.ti);

            selecionadas = [
                ...areas.portugues.slice(0, 10),
                ...areas.matematica.slice(0, 8),
                ...areas.administracao.slice(0, 8),
                ...areas.ti.slice(0, 14)
            ];
            shuffleArray(selecionadas);
        } else {
            let filtradas = bancoCompleto;
            if (materiaSelecionada !== 'todas') {
                filtradas = bancoCompleto.filter(q => q.area === materiaSelecionada);
            }
            const clonadas = [...filtradas];
            shuffleArray(clonadas);
            selecionadas = clonadas.slice(0, Math.min(20, clonadas.length));
        }

        // Reset completo do estado — garante que nada da sessão anterior vaze
        questoesAtuais = selecionadas;
        indiceAtual = 0;
        respostas = new Array(questoesAtuais.length).fill(null);
        verificadas = new Array(questoesAtuais.length).fill(false);
        acertos = 0;
        erros = 0;
        pontuacao = 0;
        finalizado = false;

        resultadoDiv.style.display = 'none';
        questaoArea.style.display = 'block';

        iniciarTimer();
        renderizarQuestao();
    }

    // ------------------------------------------------------------
    // RENDERIZAR QUESTÃO ATUAL
    // Nunca modifica indiceAtual — apenas lê o valor atual
    // ------------------------------------------------------------
    function renderizarQuestao() {
        const q = questoesAtuais[indiceAtual];
        if (!q) return;

        // Limpar área
        opcoesContainer.innerHTML = '';
        feedbackEl.style.display = 'none';
        feedbackEl.className = 'feedback';

        perguntaEl.textContent = q.p;
        categoriaBadgeEl.textContent = getNomeArea(q.area);

        // Capturar índice no momento da criação dos listeners
        const idxSnapshot = indiceAtual;
        q.o.forEach((texto, i) => {
            const div = document.createElement('div');
            div.className = 'opcao';
            div.innerHTML = '<span class="letra">' + String.fromCharCode(65 + i) + '</span> ' + texto;
            div.addEventListener('click', () => selecionarOpcao(idxSnapshot, i));
            opcoesContainer.appendChild(div);
        });

        // Restaurar estado visual salvo
        const resp = respostas[indiceAtual];
        const foiVerificada = !!verificadas[indiceAtual];
        const opcoes = opcoesContainer.querySelectorAll('.opcao');

        opcoes.forEach((el, i) => {
            if (resp === i) el.classList.add('selecionada');
            if (foiVerificada) {
                el.classList.add('desabilitada');
                if (i === q.c) el.classList.add('correto');
                else if (i === resp && resp !== q.c) el.classList.add('errado');
            }
        });

        if (foiVerificada) {
            const acertou = (resp === q.c);
            feedbackEl.className = 'feedback ' + (acertou ? 'correto' : 'errado');
            feedbackEl.style.display = 'block';
            feedbackEl.innerHTML = acertou
                ? '✅ Correto!'
                : '❌ Incorreto. Resposta correta: <strong>' + String.fromCharCode(65 + q.c) + '</strong>';
        }

        atualizarPainel();
    }

    // ------------------------------------------------------------
    // INTERAÇÕES
    // ------------------------------------------------------------
    function selecionarOpcao(indexQuestao, indexOpcao) {
        if (finalizado) return;
        if (verificadas[indexQuestao]) return;
        if (indexQuestao !== indiceAtual) return; // proteção contra closures velhos

        respostas[indexQuestao] = indexOpcao;
        const opcoes = opcoesContainer.querySelectorAll('.opcao');
        opcoes.forEach((el, i) => el.classList.toggle('selecionada', i === indexOpcao));
        btnVerificar.disabled = false;
    }

    function verificarQuestao() {
        if (finalizado) return;
        if (!!verificadas[indiceAtual]) return;

        const resp = respostas[indiceAtual];
        if (resp === null || resp === undefined) return;

        const q = questoesAtuais[indiceAtual];
        const acertou = (resp === q.c);
        verificadas[indiceAtual] = true;

        if (acertou) {
            acertos++;
            pontuacao += (q.peso || 1);
        } else {
            erros++;
        }

        const opcoes = opcoesContainer.querySelectorAll('.opcao');
        opcoes.forEach((el, i) => {
            el.classList.add('desabilitada');
            if (i === q.c) el.classList.add('correto');
            else if (i === resp && resp !== q.c) el.classList.add('errado');
        });

        feedbackEl.className = 'feedback ' + (acertou ? 'correto' : 'errado');
        feedbackEl.style.display = 'block';
        feedbackEl.innerHTML = acertou
            ? '✅ Correto!'
            : '❌ Incorreto. Resposta correta: <strong>' + String.fromCharCode(65 + q.c) + '</strong>';

        atualizarPainel();
    }

    function irParaProxima() {
        // Verificar automaticamente se há resposta pendente
        if (!verificadas[indiceAtual] && respostas[indiceAtual] !== null) {
            verificarQuestao();
        }
        if (indiceAtual < questoesAtuais.length - 1) {
            indiceAtual++;
            renderizarQuestao();
        }
    }

    function irParaAnterior() {
        if (indiceAtual > 0) {
            indiceAtual--;
            renderizarQuestao();
        }
    }

    function finalizarSimulado() {
        // Calcular pendentes
        const pendentes = questoesAtuais.filter((_, i) => respostas[i] === null).length;

        // Preencher modal com resumo rápido
        mfAcertos.textContent = acertos;
        mfErros.textContent = erros;
        mfPendentes.textContent = pendentes;
        modalFinalizarSub.textContent = pendentes > 0
            ? `Você ainda tem ${pendentes} quest${pendentes === 1 ? 'ão' : 'ões'} sem resposta.`
            : 'Você respondeu todas as questões!';

        modalFinalizar.style.display = 'flex';
    }

    function confirmarFinalizar() {
        modalFinalizar.style.display = 'none';

        finalizado = true;
        pararTimer();

        questaoArea.style.display = 'none';
        resultadoDiv.style.display = 'block';

        let totalPesos = 0;
        questoesAtuais.forEach(q => { totalPesos += (q.peso || 1); });

        const pct = totalPesos > 0 ? Math.round((pontuacao / totalPesos) * 100) : 0;

        document.getElementById('totalAcertosFinal').textContent = acertos;
        document.getElementById('totalQuestoesFinal').textContent = questoesAtuais.length;
        document.getElementById('resumoAcertos').textContent = acertos;
        document.getElementById('resumoErros').textContent = erros;
        document.getElementById('resumoPontos').textContent = pontuacao;
        document.getElementById('pontuacaoFinal').textContent = pontuacao;
        document.getElementById('pontuacaoMaxima').textContent = totalPesos;
        document.getElementById('notaFinal').textContent = pct + '%';

        SimuladoStorage.saveResult({
            modo: modoAtual === 'oficial' ? 'Edital Oficial' : 'Treino (' + getNomeArea(materiaSelecionada) + ')',
            acertos,
            totalQuestoes: questoesAtuais.length,
            pontuacao,
            pontuacaoMaxima: totalPesos,
            porcentagem: pct,
            tempoTotal: formatarTempo(segundosDecorridos)
        });
    }

    // ------------------------------------------------------------
    // HISTÓRICO & MODAL
    // ------------------------------------------------------------
    function abrirHistorico() {
        const historico = SimuladoStorage.getHistory();
        historicoLista.innerHTML = '';

        if (historico.length === 0) {
            historicoLista.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">Nenhum simulado salvo ainda.</p>';
        } else {
            historico.forEach(item => {
                const div = document.createElement('div');
                div.className = 'historico-item';
                div.innerHTML =
                    '<div><strong>' + item.modo + '</strong> - <span class="data">' + item.data + '</span>' +
                    '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">' +
                    'Acertos: ' + item.acertos + '/' + item.totalQuestoes +
                    ' | Pontos: ' + item.pontuacao + '/' + item.pontuacaoMaxima +
                    ' | Tempo: ' + item.tempoTotal + '</div></div>' +
                    '<span class="nota-badge">' + item.porcentagem + '%</span>';
                historicoLista.appendChild(div);
            });
        }
        modalHistorico.style.display = 'flex';
    }

    function fecharHistorico() {
        modalHistorico.style.display = 'none';
    }

    // ------------------------------------------------------------
    // EVENT LISTENERS
    // ------------------------------------------------------------
    btnThemeToggle.addEventListener('click', () => {
        const current = SimuladoStorage.getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        SimuladoStorage.setTheme(next);
        btnThemeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    btnHistoryToggle.addEventListener('click', abrirHistorico);
    btnFecharHistorico.addEventListener('click', fecharHistorico);
    btnLimparHistorico.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja apagar todo o histórico?')) {
            SimuladoStorage.clearHistory();
            abrirHistorico();
        }
    });

    modalHistorico.addEventListener('click', (e) => {
        if (e.target === modalHistorico) fecharHistorico();
    });

    modeBtnOficial.addEventListener('click', () => {
        modoAtual = 'oficial';
        modeBtnOficial.classList.add('active');
        modeBtnMateria.classList.remove('active');
        materiaSelectContainer.style.display = 'none';
        iniciarNovoSimulado();
    });

    modeBtnMateria.addEventListener('click', () => {
        modoAtual = 'materia';
        modeBtnMateria.classList.add('active');
        modeBtnOficial.classList.remove('active');
        materiaSelectContainer.style.display = 'block';
        iniciarNovoSimulado();
    });

    materiaSelect.addEventListener('change', (e) => {
        materiaSelecionada = e.target.value;
        iniciarNovoSimulado();
    });

    btnProxima.addEventListener('click', irParaProxima);
    btnAnterior.addEventListener('click', irParaAnterior);
    btnVerificar.addEventListener('click', verificarQuestao);
    btnFinalizar.addEventListener('click', finalizarSimulado);
    document.getElementById('btnNovoSimulado').addEventListener('click', iniciarNovoSimulado);

    // Botão Sair — volta para a tela inicial (splash)
    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
        btnSair.addEventListener('click', () => {
            pararTimer();
            // Esconder app e mostrar splash novamente
            appContainer.style.display = 'none';
            splashScreen.classList.remove('fade-out');
            splashScreen.style.display = 'flex';
        });
    }

    // Modal Finalizar
    btnCancelarFinalizar.addEventListener('click', () => { modalFinalizar.style.display = 'none'; });
    btnConfirmarFinalizar.addEventListener('click', confirmarFinalizar);
    modalFinalizar.addEventListener('click', (e) => {
        if (e.target === modalFinalizar) modalFinalizar.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' && !btnProxima.disabled) irParaProxima();
        if (e.key === 'ArrowLeft' && !btnAnterior.disabled) irParaAnterior();
        if (e.key === 'Enter' && !btnVerificar.disabled) verificarQuestao();
        if (e.key === 'Escape') {
            if (modalFinalizar.style.display === 'flex') modalFinalizar.style.display = 'none';
            if (modalHistorico.style.display === 'flex') fecharHistorico();
        }
    });

    // O simulado é iniciado pelo botão da splash screen
});
