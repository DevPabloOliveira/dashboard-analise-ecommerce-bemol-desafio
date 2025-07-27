/**
 * =====================================================================================
 * Renderização da Página 2: Análise de Logística (page2.js)
 *
 * Autor: Pablo Oliveira
 * Descrição: Este script busca dados da API de logística e do mapa geoespacial
 * para renderizar todos os componentes da página, incluindo KPIs, o mapa
 * coroplético e os diversos gráficos de análise logística.
 * =====================================================================================
 */
window.renderPage2 = async () => {
    // Define os endpoints da API para os dados de logística e do mapa.
    const API_URL = '/api/v1/page2_logistica';
    const GEO_API_URL = '/api/v1/mapa_brasil';
    console.log("Renderizando Página 2: Análise de Logística...");

    // Remove qualquer legenda do mapa anterior para evitar duplicatas ao recarregar a página.
    document.querySelector('.info.legend')?.remove();

    try {
        // Busca os dados da API e do mapa simultaneamente para otimizar o carregamento.
        const [apiResponse, geoResponse] = await Promise.all([fetch(API_URL), fetch(GEO_API_URL)]);
        if (!apiResponse.ok) throw new Error(`Erro na API de Logística: ${apiResponse.statusText}`);
        if (!geoResponse.ok) throw new Error(`Erro na API do Mapa: ${geoResponse.statusText}`);

        const data = await apiResponse.json();
        const brazilGeoJSON = await geoResponse.json();

        // --- Seção 1: Preenchimento dos Key Performance Indicators (KPIs) ---
        document.getElementById('logistica-kpi-tempo-medio-nacional').textContent = data.kpis.tempo_medio_entrega_nacional;
        document.getElementById('logistica-kpi-taxa-atraso-nacional').textContent = data.kpis.taxa_atraso_nacional;
        document.getElementById('logistica-kpi-estado-maior-atraso').textContent = data.kpis.estado_maior_atraso;
        document.getElementById('logistica-kpi-queda-satisfacao').textContent = data.kpis.queda_satisfacao_atraso;

        // --- Seção 2: Gráfico de Proporção de Pedidos Atrasados ---
        const proporcaoAtrasosLabels = data.proporcao_atrasos.map(item => item.status);
        const proporcaoAtrasosValues = data.proporcao_atrasos.map(item => item.percentual);

        // O array de datasets é construído separadamente para adicionar opções avançadas de interatividade.
        const proporcaoAtrasosDatasets = [{
            data: proporcaoAtrasosValues,
            backgroundColor: ['rgba(96, 117, 183, 0.8)', 'rgba(203, 62, 69, 0.8)'],
            hoverBackgroundColor: ['rgb(96, 117, 183)', 'rgb(203, 62, 69)'],
            hoverOffset: 20,
            hoverBorderWidth: 2,
            hoverBorderColor: '#FFFFFF',
            borderWidth: 0
        }];

        window.createChart({
            canvasId: 'logistica-proporcao-atrasos-chart',
            type: 'doughnut',
            labels: proporcaoAtrasosLabels,
            datasets: proporcaoAtrasosDatasets,
            legendDisplay: true,
            legendPosition: 'bottom',
            options: {
                cutout: '60%',
                animation: { animateScale: true, animateRotate: true },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label || ''}: ${context.parsed || 0}%`
                        }
                    }
                }
            }
        });

        // --- Seção 3: Mapa Coroplético de Atraso Médio por Estado ---
        // Função para definir a escala de cores do mapa com base nos dias de atraso.
        const getColorLogistica = (delay) => {
            if (delay > 4) return '#cb3e45';
            if (delay > 2) return '#fc7053';
            if (delay > 1) return '#ff9d6f';
            if (delay > 0) return window.Cores.primary;
            return window.Cores.surface;
        };
        
        const mapInstance = window.createLeafletMap(
            'leafletMap', data.atraso_por_estado, brazilGeoJSON, getColorLogistica,
            (feature, value) => {
                const totalPedidos = data.atraso_por_estado.find(d => d.customer_state === feature.properties.sigla_uf)?.total_pedidos || 0;
                return `<b>${feature.properties.nome_estado}</b><br>Atraso médio: ${value} dias<br>Total Pedidos: ${totalPedidos}`;
            }
        );
        
        // Adiciona uma legenda customizada ao mapa, pois a estilização é específica.
        if (mapInstance) {
            const legend = L.control({ position: 'bottomright' });
            legend.onAdd = function() {
                const div = L.DomUtil.create('div', 'info legend');
                const grades = [0, 1, 2, 4];
                div.innerHTML += '<strong>Atraso Médio (dias)</strong><br>';
                div.innerHTML += `<i style="background:${getColorLogistica(0)}"></i> No Prazo<br>`;
                grades.forEach((grade, i) => {
                    const nextGrade = grades[i + 1];
                    div.innerHTML += `<i style="background:${getColorLogistica(grade + 0.1)}"></i> ${grade}${nextGrade ? `&ndash;${nextGrade}` : '+'}<br>`;
                });
                return div;
            };
            legend.addTo(mapInstance);
        }

        // --- Seção 4: Gráfico de Atraso por Tipo de Entrega ---
        window.createChart({
            canvasId: 'logistica-atraso-tipo-entrega-chart',
            type: 'bar',
            labels: data.atraso_por_tipo_entrega.map(item => item.tipo_entrega),
            values: data.atraso_por_tipo_entrega.map(item => item.taxa_atraso_percentual),
            label: 'Taxa de Atraso (%)',
            backgroundColor: [window.Cores.primary, window.Cores.accent],
            tooltipCallback: (value) => `${value.toFixed(2)}%`
        });

        // --- Seção 5: Gráfico de Impacto do Atraso na Satisfação ---
        window.createChart({
            canvasId: 'logistica-satisfacao-vs-atraso-chart',
            type: 'bar',
            labels: data.satisfacao_vs_atraso.map(item => item.status_entrega),
            values: data.satisfacao_vs_atraso.map(item => item.nota_media_avaliacao),
            label: 'Nota Média da Avaliação',
            backgroundColor: [window.Cores.primary, window.Cores.accent],
            tooltipCallback: (value) => `${value.toFixed(2)} Estrelas`,
            options: {
                scales: { y: { beginAtZero: false, min: 2, max: 4.5 } }
            }
        });

        // --- Seção 6: Gráfico de Impacto do Método de Pagamento (Combo) ---
        // Este gráfico combinado é criado manualmente para suportar múltiplos eixos Y.
        const pagamentoLabels = data.impacto_metodo_pagamento.map(item => item.payment_type.replace(/_/g, ' '));
        const ctxPagamento = document.getElementById('logistica-impacto-pagamento-chart').getContext('2d');
        if (Chart.getChart(ctxPagamento)) { Chart.getChart(ctxPagamento).destroy(); }
        new Chart(ctxPagamento, {
            type: 'bar',
            data: {
                labels: pagamentoLabels,
                datasets: [
                    {
                        label: 'Tempo Médio Aprovação (horas)',
                        data: data.impacto_metodo_pagamento.map(item => item.tempo_medio_aprovacao_horas),
                        backgroundColor: window.Cores.primary,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Taxa de Atraso (%)',
                        data: data.impacto_metodo_pagamento.map(item => item.taxa_atraso_percentual),
                        type: 'line',
                        borderColor: window.Cores.accent,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Tempo (horas)' } },
                    y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, min: 0, ticks: { callback: (value) => `${value.toFixed(1)}%` }, title: { display: true, text: 'Taxa de Atraso (%)' } }
                },
                plugins: { legend: { display: true, position: 'bottom' } }
            }
        });

        // --- Seção 7: Gráfico de Sazonalidade dos Atrasos (Combo) ---
        const sazonalidadeLabels = data.sazonalidade_atrasos.map(item => item.ano_mes_compra);
        const ctxSazonalidade = document.getElementById('logistica-sazonalidade-atrasos-chart').getContext('2d');
        if (Chart.getChart(ctxSazonalidade)) { Chart.getChart(ctxSazonalidade).destroy(); }
        new Chart(ctxSazonalidade, {
            type: 'bar',
            data: {
                labels: sazonalidadeLabels,
                datasets: [
                    {
                        label: 'Total de Pedidos',
                        data: data.sazonalidade_atrasos.map(item => item.total_pedidos),
                        backgroundColor: window.Cores.primary,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Taxa de Atraso (%)',
                        data: data.sazonalidade_atrasos.map(item => item.taxa_atraso_percentual),
                        type: 'line',
                        borderColor: window.Cores.accent,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Total de Pedidos' } },
                    y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, min: 0, ticks: { callback: (value) => `${value.toFixed(1)}%` }, title: { display: true, text: 'Taxa de Atraso (%)' } }
                },
                plugins: { legend: { display: true, position: 'bottom' } }
            }
        });

        // --- Seção 8: Gráfico de Pareto dos Atrasos por Categoria (Combo) ---
        const paretoAtrasosLabels = data.pareto_atrasos_por_categoria.slice(0, 15).map(item => item.product_category_name);
        const ctxParetoAtrasos = document.getElementById('logistica-pareto-atrasos-chart').getContext('2d');
        if (Chart.getChart(ctxParetoAtrasos)) { Chart.getChart(ctxParetoAtrasos).destroy(); }
        new Chart(ctxParetoAtrasos, {
            type: 'bar',
            data: {
                labels: paretoAtrasosLabels,
                datasets: [
                    {
                        label: 'Total de Pedidos Atrasados',
                        data: data.pareto_atrasos_por_categoria.slice(0, 15).map(item => item.total_pedidos_atrasados),
                        backgroundColor: window.Cores.primary,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Percentual Acumulado',
                        data: data.pareto_atrasos_por_categoria.slice(0, 15).map(item => item.percentual_acumulado),
                        type: 'line',
                        borderColor: window.Cores.accent,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { type: 'linear', position: 'left', title: { display: true, text: 'Nº de Pedidos Atrasados' } },
                    y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, min: 0, max: 100, ticks: { callback: (value) => `${value}%` }, title: { display: true, text: 'Percentual Acumulado (%)' } }
                },
                plugins: { legend: { display: true, position: 'bottom' } }
            }
        });

    } catch (error) {
        // Bloco de tratamento de erros em caso de falha na busca de dados.
        console.error('Erro ao carregar dados da página de Logística:', error);
        document.getElementById('dashboard-content').innerHTML = `<div class="page-placeholder error"><h2>Erro!</h2><p>Falha ao carregar dados de Logística: ${error.message}</p></div>`;
    }
};
