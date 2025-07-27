/**
 * =====================================================================================
 * Renderização da Página 1: Análise de Vendas (page1.js)
 *
 * Autor: Pablo Oliveira
 * Descrição: Este script é responsável por buscar os dados da API de vendas
 * e renderizar todos os componentes da página de análise de vendas,
 * incluindo KPIs e gráficos.
 * =====================================================================================
 */
window.renderPage1 = async () => {
    // Define o endpoint da API para os dados de vendas.
    const API_URL = '/api/v1/page1_vendas';
    console.log("Renderizando Página 1: Análise de Vendas...");

    try {
        // Busca os dados da API.
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Erro ao carregar dados de Vendas: ${response.statusText}`);
        const data = await response.json();

        // --- Seção 1: Preenchimento dos Key Performance Indicators (KPIs) ---
        document.getElementById('vendas-kpi-total-geral').textContent = data.kpis.total_geral_vendas;
        document.getElementById('vendas-kpi-categoria-volume').textContent = data.kpis.categoria_maior_volume;
        document.getElementById('vendas-kpi-pareto-8-principais').textContent = data.kpis.percentual_8_categorias_principais;

        // --- Seção 2: Gráfico de Ranking de Vendas por Categoria ---
        // Extrai os dados das 15 principais categorias para o gráfico.
        const rankingLabels = data.ranking_geral_categorias.slice(0, 15).map(item => item.product_category_name);
        const rankingValues = data.ranking_geral_categorias.slice(0, 15).map(item => item.total_vendas);
        
        window.createChart({
            canvasId: 'vendas-ranking-chart',
            type: 'bar',
            labels: rankingLabels,
            values: rankingValues,
            label: 'Total de Vendas',
            backgroundColor: window.Cores.primary,
            tooltipCallback: (value) => `${value} Pedidos`,
            options: { indexAxis: 'y' } // Configura o gráfico para barras horizontais.
        });

        // --- Seção 3: Gráfico de Análise de Pareto (Vendas) ---
        // Este gráfico combinado (barras e linha com dois eixos Y) é criado manualmente
        // porque sua configuração é mais complexa do que a função createChart genérica suporta.
        const paretoLabels = data.pareto_analise_vendas.slice(0, 15).map(item => item.product_category_name);
        const paretoValues = data.pareto_analise_vendas.slice(0, 15).map(item => item.total_vendas);
        const paretoCumulative = data.pareto_analise_vendas.slice(0, 15).map(item => item.percentual_acumulado);

        const ctxPareto = document.getElementById('vendas-pareto-chart').getContext('2d');
        if (Chart.getChart(ctxPareto)) { Chart.getChart(ctxPareto).destroy(); }

        new Chart(ctxPareto, {
            type: 'bar',
            data: {
                labels: paretoLabels,
                datasets: [
                    {
                        label: 'Total de Vendas',
                        data: paretoValues,
                        backgroundColor: window.Cores.primary,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Percentual Acumulado',
                        data: paretoCumulative,
                        type: 'line',
                        borderColor: window.Cores.accent,
                        backgroundColor: 'rgba(203, 62, 69, 0.2)',
                        fill: false,
                        yAxisID: 'y1',
                        pointBackgroundColor: window.Cores.accent
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        title: { display: true, text: 'Total de Vendas' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        min: 0, max: 100,
                        ticks: { callback: (value) => `${value}%` },
                        title: { display: true, text: 'Percentual Acumulado (%)' }
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) { label += ': '; }
                                if (context.dataset.yAxisID === 'y1') {
                                    label += `${context.parsed.y.toFixed(2)}%`;
                                } else {
                                    label += context.parsed.y;
                                }
                                return label;
                            }
                        }
                    },
                    legend: { display: true, position: 'bottom', labels: { color: window.Cores.textSecondary } }
                }
            }
        });

        // --- Seção 4: Gráfico de Sazonalidade Mensal ---
        // Transforma os dados da API em um formato de datasets para o Chart.js,
        // onde cada linha do gráfico representa uma categoria de produto.
        const mensalLabels = [...new Set(data.sazonalidade_mensal_principais.map(item => item.periodo))].sort();
        const mensalCategories = [...new Set(data.sazonalidade_mensal_principais.map(item => item.product_category_name))];
        
        const mensalDatasets = mensalCategories.map((category, index) => {
            const categoryData = data.sazonalidade_mensal_principais.filter(item => item.product_category_name === category);
            const values = mensalLabels.map(period => {
                const item = categoryData.find(d => d.periodo === period);
                return item ? item.total_vendas : 0;
            });
            const color = `hsl(${index * (360 / mensalCategories.length)}, 70%, 60%)`;
            return {
                label: category,
                data: values,
                borderColor: color,
                backgroundColor: color + '20',
                fill: false,
                tension: 0.4,
                pointRadius: 3
            };
        });

        window.createChart({
            canvasId: 'vendas-sazonalidade-mensal-chart',
            type: 'line',
            labels: mensalLabels,
            datasets: mensalDatasets,
            options: {
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Total de Vendas' } },
                    x: { grid: { display: false }, title: { display: true, text: 'Período (Ano-Mês)' } }
                },
                plugins: {
                    legend: { display: true, position: 'right' },
                    tooltip: { mode: 'index', intersect: false }
                }
            }
        });

        // --- Seção 5: Gráfico de Sazonalidade Trimestral ---
        const trimestralLabels = [...new Set(data.sazonalidade_trimestral_principais.map(item => item.periodo))].sort();
        const trimestralCategories = [...new Set(data.sazonalidade_trimestral_principais.map(item => item.product_category_name))];
        
        const trimestralDatasets = trimestralCategories.map((category, index) => {
            const categoryData = data.sazonalidade_trimestral_principais.filter(item => item.product_category_name === category);
            const values = trimestralLabels.map(period => {
                const item = categoryData.find(d => d.periodo === period);
                return item ? item.total_vendas : 0;
            });
            const color = `hsl(${index * (360 / trimestralCategories.length) + 60}, 70%, 60%)`;
            return {
                label: category,
                data: values,
                borderColor: color,
                backgroundColor: color + '20',
                fill: false,
                tension: 0.4,
                pointRadius: 3
            };
        });

        window.createChart({
            canvasId: 'vendas-sazonalidade-trimestral-chart',
            type: 'line',
            labels: trimestralLabels,
            datasets: trimestralDatasets,
            options: {
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Total de Vendas' } },
                    x: { grid: { display: false }, title: { display: true, text: 'Período (Ano-Trimestre)' } }
                },
                plugins: {
                    legend: { display: true, position: 'right' },
                    tooltip: { mode: 'index', intersect: false }
                }
            }
        });

    } catch (error) {
        // Bloco de tratamento de erros para falhas na requisição da API.
        console.error('Erro ao carregar dados da página de Vendas:', error);
        document.getElementById('dashboard-content').innerHTML = `<div class="page-placeholder error"><h2>Erro!</h2><p>Falha ao carregar dados de Vendas: ${error.message}</p></div>`;
    }
};
