/**
 * =====================================================================================
 * Script Principal do Dashboard (main.js)
 *
 * Autor: Pablo Oliveira
 * Descrição: Este script gerencia a lógica do frontend do dashboard.
 * Responsabilidades:
 * 1. Configurar globalmente as bibliotecas (Chart.js, Leaflet).
 * 2. Fornecer funções auxiliares (helpers) para criar gráficos e mapas.
 * 3. Controlar a navegação no estilo SPA (Single-Page Application), carregando
 * dinamicamente o conteúdo das páginas sem recarregar o site.
 * =====================================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Seletores e Constantes Globais ---
    const dashboardContent = document.getElementById('dashboard-content');
    const navLinks = document.querySelectorAll('.main-nav a');

    // --- Configurações Globais ---

    /**
     * Define uma paleta de cores global para ser usada em todo o dashboard,
     * garantindo consistência visual nos gráficos e outros elementos.
     */
    window.Cores = {
        background: 'rgb(0, 0, 0)',
        surface: 'rgb(42, 43, 96)',
        primary: 'rgb(96, 117, 183)',
        accent: 'rgb(203, 62, 69)',
        text: '#FFFFFF',
        textSecondary: 'rgb(160, 170, 200)'
    };

    // Registra plugins e define padrões para todos os gráficos do Chart.js.
    if (typeof ChartjsPluginAnnotation !== 'undefined') {
        Chart.register(ChartjsPluginAnnotation);
    } else {
        console.warn("Plugin de anotação do Chart.js não foi carregado.");
    }
    Chart.defaults.color = window.Cores.text;
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.plugins.legend.display = false; // Legendas são desabilitadas por padrão.

    // =====================================================================================
    // Funções Auxiliares (Helpers)
    // =====================================================================================

    /**
     * Função fábrica para criar instâncias do Chart.js de forma padronizada.
     * @param {object} config - Objeto de configuração para o gráfico.
     * @param {string} config.canvasId - O ID do elemento <canvas>.
     * @param {string} config.type - O tipo de gráfico (ex: 'bar', 'line', 'pie').
     * @param {string[]} config.labels - Array de rótulos para o eixo X.
     * @param {object[]} [config.datasets] - Array de datasets (permite múltiplos datasets).
     * @param {object} [config.options] - Opções customizadas para sobrescrever os padrões.
     */
    window.createChart = function(config) {
        const ctx = document.getElementById(config.canvasId).getContext('2d');
        const chartType = config.type || 'bar';

        // Destrói qualquer instância de gráfico anterior no mesmo canvas para evitar conflitos.
        if (Chart.getChart(ctx)) {
            Chart.getChart(ctx).destroy();
        }
        
        const chartBackgroundColor = config.backgroundColor || 'gray'; 
        const chartBorderColor = config.borderColor || chartBackgroundColor;

        new Chart(ctx, {
            type: chartType,
            data: {
                labels: config.labels,
                datasets: config.datasets || [{
                    label: config.label,
                    data: config.values,
                    backgroundColor: chartBackgroundColor,
                    borderColor: chartBorderColor,
                    borderWidth: chartType === 'line' ? 2 : 1,
                    borderRadius: chartType === 'bar' ? 4 : undefined,
                    tension: chartType === 'line' ? 0.4 : undefined,
                    pointBackgroundColor: chartType === 'line' ? window.Cores.accent : undefined,
                    fill: chartType === 'line' ? config.fill || false : false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: {
                            callback: (value) => (config.yAxisCallback ? config.yAxisCallback(value) : value)
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            maxRotation: config.xTickMaxRotation || 0,
                            minRotation: config.xTickMinRotation || 0,
                            autoSkip: config.xTickAutoSkip || true,
                            maxTicksLimit: config.xTickMaxTicksLimit || 10
                        }
                    },
                    ...config.options?.scales
                },
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: (context) => {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                // Lida com diferentes tipos de gráficos (barra, linha, pizza, etc.).
                                const value = context.parsed.y ?? context.parsed.x ?? context.parsed;
                                if (config.tooltipCallback) {
                                    label += config.tooltipCallback(value);
                                } else {
                                    label += value;
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        display: config.legendDisplay || false,
                        position: config.legendPosition || 'bottom',
                        labels: { color: window.Cores.textSecondary }
                    },
                    annotation: config.options?.plugins?.annotation || false
                },
                ...config.options
            }
        });
    };

    /**
     * Função fábrica para criar instâncias de mapas com Leaflet.
     * @param {string} divId - O ID do elemento <div> onde o mapa será renderizado.
     * @param {object[]} apiData - Os dados da API para colorir as regiões.
     * @param {object} geoData - Os dados em formato GeoJSON com as geometrias.
     * @param {function} colorMapping - Função que define a cor de cada região baseada nos dados.
     * @param {function} [tooltipCallback] - Função opcional para customizar o texto do tooltip.
     * @returns {object} A instância do mapa Leaflet criada.
     */
    window.createLeafletMap = function(divId, apiData, geoData, colorMapping, tooltipCallback) {
        // Remove instâncias de mapa anteriores para evitar duplicatas.
        if (L.DomUtil.get(divId)?._leaflet_id) {
            const mapContainer = L.DomUtil.get(divId);
            if (mapContainer && mapContainer.map) {
                mapContainer.map.remove();
                mapContainer.map = null;
            }
        }
        
        const leafletMapInstance = L.map(divId, { zoomControl: false }).setView([-14.235, -51.925], 4);
        L.control.zoom({ position: 'topright' }).addTo(leafletMapInstance);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(leafletMapInstance);

        function style(feature) {
            const stateData = apiData.find(d => d.customer_state === feature.properties.sigla_uf);
            const delayValue = (stateData && typeof stateData.atraso_medio_dias === 'number') ? stateData.atraso_medio_dias : 0; 
            return {
                fillColor: colorMapping(delayValue),
                weight: 1.5,
                opacity: 1,
                color: '#000',
                fillOpacity: 0.8
            };
        }

        L.geoJson(geoData, {
            style: style,
            onEachFeature: (feature, layer) => {
                const stateData = apiData.find(d => d.customer_state === feature.properties.sigla_uf);
                const valueForTooltip = (stateData && typeof stateData.atraso_medio_dias === 'number') ? stateData.atraso_medio_dias.toFixed(1) : 'N/A';
                const tooltipContent = tooltipCallback ? tooltipCallback(feature, valueForTooltip) : `<b>${feature.properties.nome_estado || feature.properties.sigla_uf}</b><br>Atraso médio: ${valueForTooltip} dias`;
                layer.bindTooltip(tooltipContent);
                
                layer.on({
                    mouseover: (e) => e.target.setStyle({ weight: 3, color: window.Cores.accent }),
                    mouseout: (e) => e.target.setStyle({ weight: 1.5, color: '#000' })
                });
            }
        }).addTo(leafletMapInstance);

        return leafletMapInstance;
    };


    // =====================================================================================
    // Lógica da Navegação SPA (Single-Page Application)
    // =====================================================================================
    
    /**
     * Carrega o conteúdo de uma página dinamicamente via fetch e o injeta no DOM.
     * @param {string} pageName - O nome da página a ser carregada (ex: 'page1').
     */
    const loadPage = async (pageName) => {
        try {
            dashboardContent.innerHTML = '<div class="page-placeholder"><h2>Carregando...</h2></div>';
            
            const response = await fetch(`/static/html/${pageName}.html`);
            if (!response.ok) throw new Error(`Página ${pageName}.html não encontrada.`);
            
            dashboardContent.innerHTML = await response.text();

            // Ativa a função de renderização específica da página (ex: renderPage1()).
            const renderFunction = window[`render${pageName.charAt(0).toUpperCase() + pageName.slice(1)}`];
            if (typeof renderFunction === 'function') {
                renderFunction();
            } else {
                console.warn(`Função de renderização para ${pageName} não encontrada.`);
            }

            // Atualiza o link ativo na barra de navegação.
            navLinks.forEach(link => link.classList.remove('active'));
            document.querySelector(`.main-nav a[data-page="${pageName}"]`)?.classList.add('active');

        } catch (error) {
            console.error('Erro ao carregar página:', error);
            dashboardContent.innerHTML = `<div class="page-placeholder error"><h2>Erro!</h2><p>${error.message}</p></div>`;
        }
    };

    // Adiciona o listener de clique para os links de navegação.
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const pageName = event.target.dataset.page;
            if (pageName) {
                loadPage(pageName);
                history.pushState({ page: pageName }, '', `#${pageName}`);
            }
        });
    });

    // Gerencia o estado de navegação (botões de voltar/avançar do navegador).
    window.addEventListener('popstate', (event) => {
        const page = (event.state && event.state.page) || (window.location.hash.substring(1)) || 'page1';
        loadPage(page);
    });

    // Carrega a página inicial baseada na URL ou define 'page1' como padrão.
    const initialPage = window.location.hash ? window.location.hash.substring(1) : 'page1'; 
    loadPage(initialPage);
});
