/**
 * =====================================================================================
 * Renderização da Página 5: Análise de Marketing (page5.js)
 *
 * Autor: Pablo Oliveira
 * Descrição: Este script busca dados da API de marketing e renderiza os componentes
 * da página, incluindo KPIs e gráficos de taxa de conversão por estado e
 * método de pagamento.
 * =====================================================================================
 */
window.renderPage5 = async () => {
    // Define o endpoint da API para os dados de marketing.
    const API_URL = '/api/v1/page5_marketing';
    console.log("Renderizando Página 5: Análise de Marketing...");

    try {
        // Busca os dados da API.
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`Erro ao carregar dados de Marketing: ${response.statusText}`);
        const data = await response.json();

        // --- Seção 1: Preenchimento dos Key Performance Indicators (KPIs) ---
        document.getElementById('marketing-kpi-taxa-conversao-nacional').textContent = data.kpis.taxa_conversao_media_nacional;
        document.getElementById('marketing-kpi-estado-maior-conversao').textContent = data.kpis.estado_maior_conversao;
        document.getElementById('marketing-kpi-tipo-pagamento-maior-conversao').textContent = data.kpis.tipo_pagamento_maior_conversao;

        // --- Seção 2: Análise de Conversão por Estado ---
        const estadosLabels = data.data_estados_maior_volume.map(item => item.customer_state);
        
        // Gráfico 2.1: Taxa de Conversão dos Estados com Maior Volume
        const conversaoEstadosValues = data.data_estados_maior_volume.map(item => item.conversion_rate);
        const estadosColors = [
            '#6075B7', '#7A8EB4', '#94A7D1', '#AFBEEB', '#C9D6F8',
            '#6075B7', '#7A8EB4', '#94A7D1', '#AFBEEB', '#C9D6F8'
        ];
        window.createChart({
            canvasId: 'marketing-conversao-estado-chart',
            type: 'bar',
            labels: estadosLabels,
            values: conversaoEstadosValues,
            label: 'Taxa de Conversão (%)',
            backgroundColor: estadosColors,
            tooltipCallback: (value) => `${value.toFixed(2)}%`,
            options: {
                scales: {
                    y: {
                        beginAtZero: false,
                        min: Math.min(...conversaoEstadosValues) * 0.95,
                        max: 100
                    }
                }
            }
        });

        // Gráfico 2.2: Volume Total de Pedidos dos Estados
        const totalPedidosEstadosValues = data.data_estados_maior_volume.map(item => item.total_orders);
        window.createChart({
            canvasId: 'marketing-total-pedidos-estado-chart',
            type: 'bar',
            labels: estadosLabels,
            values: totalPedidosEstadosValues,
            label: 'Total de Pedidos',
            backgroundColor: '#8AB4F8',
            tooltipCallback: (value) => `${value.toLocaleString('pt-BR')} Pedidos`
        });

        // --- Seção 3: Análise de Conversão por Tipo de Pagamento ---
        const pagamentoLabels = data.conversion_by_payment_type_final.map(item => item.payment_type.replace(/_/g, ' '));
        
        // Gráfico 3.1: Taxa de Conversão por Tipo de Pagamento
        const conversaoPagamentoValues = data.conversion_by_payment_type_final.map(item => item.conversion_rate);
        window.createChart({
            canvasId: 'marketing-conversao-pagamento-chart',
            type: 'bar',
            labels: pagamentoLabels,
            values: conversaoPagamentoValues,
            label: 'Taxa de Conversão (%)',
            backgroundColor: window.Cores.primary,
            tooltipCallback: (value) => `${value.toFixed(2)}%`,
            options: {
                scales: {
                    y: { beginAtZero: false, min: 90, max: 100 }
                }
            }
        });

        // Gráfico 3.2: Volume Total de Pedidos por Tipo de Pagamento
        const totalPedidosPagamentoValues = data.conversion_by_payment_type_final.map(item => item.total_orders);
        window.createChart({
            canvasId: 'marketing-total-pedidos-pagamento-chart',
            type: 'bar',
            labels: pagamentoLabels,
            values: totalPedidosPagamentoValues,
            label: 'Total de Pedidos',
            backgroundColor: '#B0BEC5',
            tooltipCallback: (value) => `${value.toLocaleString('pt-BR')} Pedidos`
        });

    } catch (error) {
        // Bloco de tratamento de erros em caso de falha na requisição da API.
        console.error('Erro ao carregar dados da página de Marketing:', error);
        document.getElementById('dashboard-content').innerHTML = `<div class="page-placeholder error"><h2>Erro!</h2><p>Falha ao carregar dados de Marketing: ${error.message}</p></div>`;
    }
};
