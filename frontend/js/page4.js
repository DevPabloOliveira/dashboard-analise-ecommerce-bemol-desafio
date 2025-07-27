/**
 * =====================================================================================
 * Renderização da Página 4: Análise Financeira (page4.js)
 *
 * Autor: Pablo Oliveira
 * Descrição: Este script busca dados da API financeira e renderiza os componentes
 * da página, incluindo KPIs e gráficos de receita, lucratividade e margens.
 * =====================================================================================
 */
window.renderPage4 = async () => {
    // Define o endpoint da API para os dados financeiros.
    const API_URL = '/api/v1/page4_financeiro';
    console.log("Renderizando Página 4: Análise Financeira...");

    try {
        // Busca os dados da API.
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Erro ao carregar dados Financeiros: ${response.statusText}`);
        const data = await response.json();

        // --- Seção 1: Preenchimento dos Key Performance Indicators (KPIs) ---
        document.getElementById('financeiro-kpi-receita-bruta-total').textContent = data.kpis.receita_bruta_total;
        document.getElementById('financeiro-kpi-receita-liquida-total-pos-frete').textContent = data.kpis.receita_liquida_total_pos_frete;
        document.getElementById('financeiro-kpi-margem-media-pos-frete').textContent = data.kpis.margem_media_pos_frete;
        document.getElementById('financeiro-kpi-num-categorias-80-receita').textContent = data.kpis.num_categorias_80_receita;

        // --- Seção 2: Gráfico de Análise de Pareto da Receita ---
        // Este gráfico combinado (barras e linha) é criado manualmente para suportar múltiplos eixos Y.
        const paretoReceitaLabels = data.pareto_receita_pos_frete.slice(0, 15).map(item => item.categoria);
        const paretoReceitaValues = data.pareto_receita_pos_frete.slice(0, 15).map(item => item.receita_liquida_pos_frete);
        const paretoReceitaCumulative = data.pareto_receita_pos_frete.slice(0, 15).map(item => item.percentual_acumulado);

        const ctxParetoReceita = document.getElementById('financeiro-pareto-receita-chart').getContext('2d');
        if (Chart.getChart(ctxParetoReceita)) { Chart.getChart(ctxParetoReceita).destroy(); }

        new Chart(ctxParetoReceita, {
            type: 'bar',
            data: {
                labels: paretoReceitaLabels,
                datasets: [{
                    label: 'Receita Líquida Pós-Frete (R$)',
                    data: paretoReceitaValues,
                    backgroundColor: window.Cores.primary,
                    yAxisID: 'y'
                }, {
                    label: 'Percentual Acumulado',
                    data: paretoReceitaCumulative,
                    type: 'line',
                    borderColor: window.Cores.accent,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Receita Líquida Pós-Frete (R$)' }, ticks: { callback: (value) => `R$ ${value.toLocaleString('pt-BR')}` } },
                    y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, min: 0, max: 100, ticks: { callback: (value) => `${value}%` }, title: { display: true, text: 'Percentual Acumulado (%)' } }
                },
                plugins: { legend: { display: true, position: 'bottom' } }
            }
        });

        // --- Seção 3: Gráfico de Distribuição da Receita Bruta (Histograma) ---
        // A lógica para criar o histograma (binning) e adicionar as linhas de anotação
        // (quartis) é customizada, por isso o gráfico é instanciado manualmente.
        const receitaHistogramData = data.receita_bruta_para_histograma.map(item => item.receita_bruta);
        const quartisLimiar = data.receita_bruta_quartis_limiar;

        const ctxDistribuicaoReceita = document.getElementById('financeiro-distribuicao-receita-chart').getContext('2d');
        if (Chart.getChart(ctxDistribuicaoReceita)) { Chart.getChart(ctxDistribuicaoReceita).destroy(); }

        const numBins = 30;
        const minVal = Math.min(...receitaHistogramData);
        const maxVal = Math.max(...receitaHistogramData);
        const binSize = (maxVal - minVal) / numBins;
        const bins = Array.from({ length: numBins }, (_, i) => minVal + i * binSize);
        const histogramCounts = new Array(numBins).fill(0);
        receitaHistogramData.forEach(val => {
            const binIndex = Math.min(Math.floor((val - minVal) / binSize), numBins - 1);
            histogramCounts[binIndex]++;
        });

        const getQuartilValue = (metric) => quartisLimiar.find(q => q.Métrica === metric)?.Valor ?? null;
        const q1Val = getQuartilValue('Q1');
        const medianVal = getQuartilValue('Mediana');
        const q3Val = getQuartilValue('Q3');

        new Chart(ctxDistribuicaoReceita, {
            type: 'line',
            data: {
                labels: bins,
                datasets: [{
                    label: 'Contagem de Categorias',
                    data: histogramCounts,
                    borderColor: window.Cores.primary,
                    fill: true,
                    backgroundColor: 'rgba(96, 117, 183, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Contagem de Categorias' } },
                    x: { type: 'logarithmic', grid: { display: false }, title: { display: true, text: 'Receita Bruta (R$)' }, ticks: { callback: (value) => 'R$ ' + Number(value.toPrecision(3)).toLocaleString('pt-BR') } }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            title: (context) => `Faixa de Receita: ~${Number(context[0].label).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}`,
                            label: (context) => `Contagem: ${context.parsed.y} categorias`
                        }
                    },
                    annotation: {
                        annotations: {
                            q1: { type: 'line', xMin: q1Val, xMax: q1Val, borderColor: 'orange', borderWidth: 2, borderDash: [6, 6], label: { content: `Q1: R$ ${q1Val.toLocaleString('pt-BR')}`, enabled: true, position: 'start' } },
                            median: { type: 'line', xMin: medianVal, xMax: medianVal, borderColor: 'red', borderWidth: 2, borderDash: [6, 6], label: { content: `Mediana: R$ ${medianVal.toLocaleString('pt-BR')}`, enabled: true, position: 'end' } },
                            q3: { type: 'line', xMin: q3Val, xMax: q3Val, borderColor: 'purple', borderWidth: 2, borderDash: [6, 6], label: { content: `Q3: R$ ${q3Val.toLocaleString('pt-BR')}`, enabled: true, position: 'end' } }
                        }
                    }
                }
            }
        });

        // --- Seção 4: Gráfico de Composição da Receita Bruta ---
        // Este gráfico de barras empilhadas é criado manualmente para configurar os eixos e datasets específicos.
        const composicaoLabels = data.composicao_receita_maior_impacto.map(item => item.categoria);
        const ctxComposicao = document.getElementById('financeiro-composicao-receita-chart').getContext('2d');
        if (Chart.getChart(ctxComposicao)) { Chart.getChart(ctxComposicao).destroy(); }

        new Chart(ctxComposicao, {
            type: 'bar',
            data: {
                labels: composicaoLabels,
                datasets: [{
                    label: 'Receita Líquida Pós-Frete',
                    data: data.composicao_receita_maior_impacto.map(item => item.receita_liquida_pos_frete),
                    backgroundColor: window.Cores.primary
                }, {
                    label: 'Custo do Frete',
                    data: data.composicao_receita_maior_impacto.map(item => item.custo_frete_total),
                    backgroundColor: window.Cores.accent
                }]
            },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { stacked: true, beginAtZero: true, title: { display: true, text: 'Valor (R$)' }, ticks: { callback: (value) => `R$ ${value.toLocaleString('pt-BR')}` } },
                    y: { stacked: true, grid: { display: false } }
                },
                plugins: { legend: { display: true, position: 'bottom' } }
            }
        });

        // --- Seção 5: Gráfico das Categorias com Maiores Margens Percentuais ---
        window.createChart({
            canvasId: 'financeiro-maiores-margens-chart',
            type: 'bar',
            labels: data.maiores_margens_categorias.map(item => item.categoria),
            values: data.maiores_margens_categorias.map(item => item.margem_percentual_pos_frete),
            label: 'Margem Percentual Pós-Frete (%)',
            backgroundColor: window.Cores.primary,
            tooltipCallback: (value) => `${value.toFixed(2)}%`,
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        title: { display: true, text: 'Margem Percentual Pós-Frete (%)' },
                        ticks: { callback: (value) => `${value}%` }
                    },
                    y: { grid: { display: false } }
                }
            }
        });

    } catch (error) {
        // Bloco de tratamento de erros em caso de falha na requisição da API.
        console.error('Erro ao carregar dados da página Financeira:', error);
        document.getElementById('dashboard-content').innerHTML = `<div class="page-placeholder error"><h2>Erro!</h2><p>Falha ao carregar dados Financeiros: ${error.message}</p></div>`;
    }
};
