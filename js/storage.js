/* ============================================================
   SIMULADO CONCURSO TI - GERENCIADOR DE ARMAZENAMENTO LOCAL
   ============================================================ */

const STORAGE_KEYS = {
    HISTORICO: 'simulado_ti_historico',
    THEME: 'simulado_ti_theme'
};

const SimuladoStorage = {
    /**
     * Salva um resultado de simulado no localStorage
     */
    saveResult(resultado) {
        try {
            const historico = this.getHistory();
            const novoItem = {
                id: Date.now(),
                data: new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                modo: resultado.modo || 'Oficial (Edital)',
                acertos: resultado.acertos,
                totalQuestoes: resultado.totalQuestoes,
                pontuacao: resultado.pontuacao,
                pontuacaoMaxima: resultado.pontuacaoMaxima,
                porcentagem: resultado.porcentagem,
                tempoTotal: resultado.tempoTotal || 'N/I'
            };

            historico.unshift(novoItem);
            // Mantém os últimos 30 simulados salvos
            const historicoLimitado = historico.slice(0, 30);
            localStorage.setItem(STORAGE_KEYS.HISTORICO, JSON.stringify(historicoLimitado));
            return true;
        } catch (e) {
            console.error('Erro ao salvar resultado no storage:', e);
            return false;
        }
    },

    /**
     * Retorna a lista de simulados salvos
     */
    getHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEYS.HISTORICO);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Erro ao ler histórico do storage:', e);
            return [];
        }
    },

    /**
     * Limpa o histórico de simulados
     */
    clearHistory() {
        try {
            localStorage.removeItem(STORAGE_KEYS.HISTORICO);
            return true;
        } catch (e) {
            console.error('Erro ao limpar histórico:', e);
            return false;
        }
    },

    /**
     * Obtém o tema preferido do usuário (light / dark)
     */
    getTheme() {
        return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    },

    /**
     * Define e salva o tema
     */
    setTheme(theme) {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
        document.documentElement.setAttribute('data-theme', theme);
    }
};

// Exportação global explícita
window.SimuladoStorage = SimuladoStorage;

