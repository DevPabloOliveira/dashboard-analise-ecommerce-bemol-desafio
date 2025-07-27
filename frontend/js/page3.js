/**
 * =====================================================================================
 * Renderização da Página 3: Análise de Satisfação do Cliente (page3.js)
 *
 * Autor: Pablo Oliveira
 * Descrição: Este script busca dados da API de satisfação do cliente e renderiza
 * todos os componentes visuais da página, incluindo KPIs e gráficos de avaliação.
 * =====================================================================================
 */
window.renderPage3 = async () => {
    // Define o endpoint da API para os dados de satisfação.
    const API_URL = '/api/v1/page3_satisfacao';
    console.log("Renderizando Página 3: Análise de Satisfação do Cliente...");

    try {
        // Busca os dados da API.
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Erro ao carregar dados de Satisfação: ${response.statusText}`);
        const data = await response.json();

        // --- Seção 1: Preenchimento dos Key Performance Indicators (KPIs) ---
        document.getElementById('satisfacao-kpi-5-estrelas').textContent = data.kpis.percentual_5_estrelas;
        document.getElementById('satisfacao-kpi-nota-media-geral').textContent = data.kpis.nota_media_geral;
        document.getElementById('satisfacao-kpi-melhor-categoria').textContent = data.kpis.categoria_melhor_avaliacao;
        document.getElementById('satisfacao-kpi-pior-categoria').textContent = data.kpis.categoria_pior_avaliacao;

        // --- Seção 2: Gráfico de Distribuição das Avaliações ---
        // Este gráfico é criado manualmente para permitir uma escala de cores customizada
        // para cada nota (1 a 5 estrelas) e um tooltip que exibe tanto a contagem
        // absoluta quanto o percentual.
        const distribuicaoLabels = data.distribuicao_avaliacoes.map(item => `${item.review_score} Estrelas`);
        const distribuicaoValues = data.distribuicao_avaliacoes.map(item => item.total_avaliacoes);
        const distribuicaoPercentages = data.distribuicao_avaliacoes.map(item => item.percentual);

        const ctxDistribuicao = document.getElementById('satisfacao-distribuicao-chart').getContext('2d');
        if (Chart.getChart(ctxDistribuicao)) { Chart.getChart(ctxDistribuicao).destroy(); }

        new Chart(ctxDistribuicao, {
            type: 'bar',
            data: {
                labels: distribuicaoLabels,
                datasets: [{
                    label: 'Quantidade de Avaliações',
                    data: distribuicaoValues,
                    backgroundColor: [
                        window.Cores.accent, // 1 estrela
                        '#ff9d6f',           // 2 estrelas
                        window.Cores.primary, // 3 estrelas
                        '#66b3ff',           // 4 estrelas
                        '#4CAF50'            // 5 estrelas
                    ],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const percentage = distribuicaoPercentages[context.dataIndex];
                                return `Total: ${value.toLocaleString('pt-BR')} (${percentage.toFixed(1)}%)`;
                            }
                        }
                    }
                }
            }
        });

        // --- Seção 3: Gráfico das 10 Categorias com Melhores Avaliações ---
        window.createChart({
            canvasId: 'satisfacao-10-melhores-chart',
            type: 'bar',
            labels: data.ranking_10_melhores_categorias.map(item => item.categoria_produto),
            values: data.ranking_10_melhores_categorias.map(item => item.nota_media_categoria),
            label: 'Nota Média',
            backgroundColor: window.Cores.primary,
            tooltipCallback: (value) => `${value.toFixed(2)} Estrelas`,
            options: {
                indexAxis: 'y', // Configura o gráfico para barras horizontais.
                scales: {
                    x: { beginAtZero: false, min: 3.4, max: 4.5, title: { display: true, text: 'Nota Média' } }
                }
            }
        });

        // --- Seção 4: Gráfico das 10 Categorias com Piores Avaliações ---
        window.createChart({
            canvasId: 'satisfacao-10-piores-chart',
            type: 'bar',
            labels: data.ranking_10_piores_categorias.map(item => item.categoria_produto),
            values: data.ranking_10_piores_categorias.map(item => item.nota_media_categoria),
            label: 'Nota Média',
            backgroundColor: window.Cores.accent,
            tooltipCallback: (value) => `${value.toFixed(2)} Estrelas`,
            options: {
                indexAxis: 'y', // Configura o gráfico para barras horizontais.
                scales: {
                    x: { beginAtZero: false, min: 3.4, max: 4.5, title: { display: true, text: 'Nota Média' } }
                }
            }
        });

        // --- Seção 5: Gráfico de Ranking Completo de Satisfação ---
        const rankingCompletoLabels = data.ranking_completo_categorias.map(item => item.categoria_produto);
        const rankingCompletoValues = data.ranking_completo_categorias.map(item => item.nota_media_categoria);

        // Define cores de fundo dinamicamente para destacar as 5 melhores (verde),
        // as 5 piores (salmão) e as categorias intermediárias (azul).
        const backgroundColors = rankingCompletoLabels.map((_, i) => {
            if (i < 5) return 'seagreen';
            if (i >= rankingCompletoLabels.length - 5) return 'salmon';
            return window.Cores.primary;
        });

        window.createChart({
            canvasId: 'satisfacao-ranking-completo-chart',
            type: 'bar',
            labels: rankingCompletoLabels,
            values: rankingCompletoValues,
            label: 'Nota Média da Avaliação',
            backgroundColor: backgroundColors,
            borderColor: backgroundColors,
            options: {
                indexAxis: 'y', // Configura o gráfico para barras horizontais.
                scales: {
                    x: {
                        beginAtZero: false,
                        min: Math.min(...rankingCompletoValues) * 0.95,
                        max: Math.max(...rankingCompletoValues) * 1.05,
                        title: { display: true, text: 'Nota Média da Avaliação' },
                        ticks: { callback: (value) => value.toFixed(1) }
                    },
                    y: { grid: { display: false } }
                },
                tooltipCallback: (value) => `${value.toFixed(2)} Estrelas`
            }
        });

    } catch (error) {
        // Bloco de tratamento de erros em caso de falha na requisição da API.
        console.error('Erro ao carregar dados da página de Satisfação:', error);
        document.getElementById('dashboard-content').innerHTML = `<div class="page-placeholder error"><h2>Erro!</h2><p>Falha ao carregar dados de Satisfação: ${error.message}</p></div>`;
    }
};
