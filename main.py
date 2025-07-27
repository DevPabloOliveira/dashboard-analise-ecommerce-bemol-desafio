# =====================================================================================
# API Principal para o Dashboard de Análise de E-commerce
# Autor: Pablo Oliveira
# Descrição: Este script utiliza o framework FastAPI para criar uma API que serve
#            dados processados e os arquivos estáticos para um dashboard interativo.
#            Os dados são carregados e pré-processados na inicialização da aplicação.
# =====================================================================================

import pandas as pd
import geopandas as gpd
from fastapi import FastAPI, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# --- Configuração da Aplicação FastAPI ---
app = FastAPI(
    title="API de Análise de Performance de E-commerce",
    description="API para o Dashboard de Análise de Performance de Vendas, Logística, Satisfação, Financeira e Marketing da Olist.",
    version="3.0.0"
)

# --- Definição de Constantes e Caminhos ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'data')
DATA_UF_PATH = os.path.join(BASE_DIR, 'data_uf')
FRONTEND_PATH = os.path.join(BASE_DIR, 'frontend')

# --- Armazenamento de Dados em Memória ---
# Dicionários globais para manter os dados processados e evitar recarregamentos.
processed_data = {}
geojson_data = {}

# Mapeamento de siglas de estados para nomes completos, usado nos tooltips do mapa.
sigla_para_estado = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
    'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
    'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
    'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
    'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
    'SE': 'Sergipe', 'TO': 'Tocantins'
}

# =====================================================================================
# Evento de Inicialização da API (Startup)
# =====================================================================================
@app.on_event("startup")
async def load_and_process_all_data():
    """
    Carrega e processa todos os arquivos CSV na inicialização da API.
    Os dados são armazenados em memória para acesso rápido pelos endpoints.
    """
    global processed_data, geojson_data
    print("Iniciando o carregamento e pré-processamento dos dados...")

    # --- Carregamento de Dados Geoespaciais ---
    try:
        map_csv_path = os.path.join(DATA_UF_PATH, 'br_geobr_mapas_uf.csv')
        map_df = pd.read_csv(map_csv_path)
        map_df['geometria'] = gpd.GeoSeries.from_wkt(map_df['geometria'])
        gdf = gpd.GeoDataFrame(map_df, geometry='geometria')
        gdf = gdf.dissolve(by='sigla_uf').reset_index()
        gdf['nome_estado'] = gdf['sigla_uf'].map(sigla_para_estado)
        
        # Reprojeta as coordenadas para o padrão WGS84, usado em mapas web.
        gdf = gdf.set_crs(epsg=4674, allow_override=True)
        gdf = gdf.to_crs(epsg=4326)

        geojson_data = gdf.to_json()
        print("Dados geoespaciais carregados com sucesso.")
    except Exception as e:
        print(f"ERRO ao carregar dados geoespaciais: {e}")
        geojson_data = {}

    # --- Processamento dos Dados de Análise ---

    # Análise 1: Performance de Vendas
    try:
        vendas_ranking_geral_df = pd.read_csv(os.path.join(DATA_PATH, 'a1', 'ranking_geral_categorias.csv'))
        vendas_pareto_analise_df = pd.read_csv(os.path.join(DATA_PATH, 'a1', 'analise_pareto_vendas.csv'))
        vendas_sazonalidade_mensal_principais_df = pd.read_csv(os.path.join(DATA_PATH, 'a1', 'sazonalidade_mensal_principais_categorias.csv'))
        vendas_sazonalidade_trimestral_principais_df = pd.read_csv(os.path.join(DATA_PATH, 'a1', 'sazonalidade_trimestral_principais_categorias.csv'))
        
        # Calcula e formata os KPIs para a página de vendas.
        total_vendas_geral = vendas_ranking_geral_df['total_vendas'].sum()
        categoria_maior_volume = vendas_ranking_geral_df.iloc[0]['product_category_name'] if not vendas_ranking_geral_df.empty else "N/A"
        percentual_8_categorias_principais = vendas_pareto_analise_df.head(8)['percentual_acumulado'].iloc[-1] if len(vendas_pareto_analise_df) >= 8 else "N/A"

        processed_data['vendas_kpis'] = {
            "total_geral_vendas": f"{total_vendas_geral:,.0f} Pedidos",
            "categoria_maior_volume": categoria_maior_volume,
            "percentual_8_categorias_principais": f"{percentual_8_categorias_principais:.2f}%" if isinstance(percentual_8_categorias_principais, (int, float)) else "N/A"
        }
        
        processed_data['vendas_ranking_geral'] = vendas_ranking_geral_df.to_dict(orient='records')
        processed_data['vendas_pareto_analise'] = vendas_pareto_analise_df.to_dict(orient='records')
        processed_data['vendas_sazonalidade_mensal_principais'] = vendas_sazonalidade_mensal_principais_df.to_dict(orient='records')
        processed_data['vendas_sazonalidade_trimestral_principais'] = vendas_sazonalidade_trimestral_principais_df.to_dict(orient='records')
        print("Dados de Análise de Vendas (a1) carregados.")
    except Exception as e:
        print(f"ERRO ao carregar dados de Vendas (a1): {e}")
        # Define valores padrão em caso de falha.
        processed_data.update({
            'vendas_kpis': {}, 'vendas_ranking_geral': [], 'vendas_pareto_analise': [],
            'vendas_sazonalidade_mensal_principais': [], 'vendas_sazonalidade_trimestral_principais': []
        })

    # Análise 2: Logística
    try:
        logistica_proporcao_atrasos_df = pd.read_csv(os.path.join(DATA_PATH, 'a2', 'logistica_proporcao_atrasos.csv'))
        logistica_atraso_por_estado_df = pd.read_csv(os.path.join(DATA_PATH, 'a2', 'logistica_atraso_por_estado.csv'))
        logistica_satisfacao_vs_atraso_df = pd.read_csv(os.path.join(DATA_PATH, 'a2', 'logistica_satisfacao_vs_atraso.csv'))
        df_final_logistica_raw = pd.read_csv(os.path.join(DATA_PATH, 'a2', 'logistica_final_analysis_df.csv'))
        
        # Calcula e formata os KPIs para a página de logística.
        taxa_atraso_nacional = logistica_proporcao_atrasos_df[logistica_proporcao_atrasos_df['status'] == 'Com Atraso']['percentual'].iloc[0] if not logistica_proporcao_atrasos_df.empty else 0.0
        estado_maior_atraso_data = logistica_atraso_por_estado_df.iloc[0]
        estado_maior_atraso_str = f"{estado_maior_atraso_data['customer_state']} ({estado_maior_atraso_data['atraso_medio_dias']:.1f} dias)"
        q_atraso = logistica_satisfacao_vs_atraso_df[logistica_satisfacao_vs_atraso_df['status_entrega'] == 'Com Atraso']['nota_media_avaliacao'].iloc[0]
        q_no_prazo = logistica_satisfacao_vs_atraso_df[logistica_satisfacao_vs_atraso_df['status_entrega'] == 'No Prazo']['nota_media_avaliacao'].iloc[0]
        
        df_final_logistica_raw['order_purchase_timestamp'] = pd.to_datetime(df_final_logistica_raw['order_purchase_timestamp'], errors='coerce')
        df_final_logistica_raw['order_delivered_customer_date'] = pd.to_datetime(df_final_logistica_raw['order_delivered_customer_date'], errors='coerce')
        df_final_logistica_raw['tempo_de_entrega_dias'] = (df_final_logistica_raw['order_delivered_customer_date'] - df_final_logistica_raw['order_purchase_timestamp']).dt.days
        tempo_medio_nacional = df_final_logistica_raw['tempo_de_entrega_dias'].mean()

        processed_data['logistica_kpis'] = {
            "taxa_atraso_nacional": f"{taxa_atraso_nacional:.2f}%",
            "estado_maior_atraso": estado_maior_atraso_str,
            "queda_satisfacao_atraso": f"{q_no_prazo - q_atraso:.2f} pontos",
            "tempo_medio_entrega_nacional": f"{tempo_medio_nacional:.1f} dias"
        }

        # Carrega os demais dataframes para os endpoints.
        processed_data['logistica_proporcao_atrasos'] = logistica_proporcao_atrasos_df.to_dict(orient='records')
        processed_data['logistica_atraso_por_estado'] = logistica_atraso_por_estado_df.to_dict(orient='records')
        processed_data['logistica_satisfacao_vs_atraso'] = logistica_satisfacao_vs_atraso_df.to_dict(orient='records')
        processed_data['logistica_atraso_por_tipo_entrega'] = pd.read_csv(os.path.join(DATA_PATH, 'a2', 'logistica_atraso_por_tipo_entrega.csv')).to_dict(orient='records')
        processed_data['logistica_pareto_atrasos_por_categoria'] = pd.read_csv(os.path.join(DATA_PATH, 'a2', 'logistica_pareto_atrasos_por_categoria.csv')).to_dict(orient='records')
        processed_data['logistica_sazonalidade_atrasos'] = pd.read_csv(os.path.join(DATA_PATH, 'a2', 'logistica_sazonalidade_atrasos.csv')).to_dict(orient='records')
        processed_data['logistica_impacto_metodo_pagamento'] = pd.read_csv(os.path.join(DATA_PATH, 'a2', 'logistica_impacto_metodo_pagamento.csv')).to_dict(orient='records')
        print("Dados de Análise de Logística (a2) carregados.")
    except Exception as e:
        print(f"ERRO ao carregar dados de Logística (a2): {e}")
        processed_data.update({
            'logistica_kpis': {}, 'logistica_proporcao_atrasos': [], 'logistica_atraso_por_estado': [],
            'logistica_satisfacao_vs_atraso': [], 'logistica_atraso_por_tipo_entrega': [],
            'logistica_pareto_atrasos_por_categoria': [], 'logistica_sazonalidade_atrasos': [],
            'logistica_impacto_metodo_pagamento': []
        })

    # Análise 3: Satisfação do Cliente
    try:
        satisfacao_distribuicao_avaliacoes_df = pd.read_csv(os.path.join(DATA_PATH, 'a3', 'satisfacao_distribuicao_avaliacoes.csv'))
        satisfacao_ranking_completo_categorias_df = pd.read_csv(os.path.join(DATA_PATH, 'a3', 'satisfacao_ranking_completo_categorias.csv'))
        
        # Calcula e formata os KPIs para a página de satisfação.
        percentual_5_estrelas = satisfacao_distribuicao_avaliacoes_df[satisfacao_distribuicao_avaliacoes_df['review_score'] == 5]['percentual'].iloc[0]
        nota_media_geral = (satisfacao_distribuicao_avaliacoes_df['review_score'] * satisfacao_distribuicao_avaliacoes_df['total_avaliacoes']).sum() / satisfacao_distribuicao_avaliacoes_df['total_avaliacoes'].sum()
        categoria_melhor_avaliacao = satisfacao_ranking_completo_categorias_df.iloc[0]['categoria_produto']
        categoria_pior_avaliacao = satisfacao_ranking_completo_categorias_df.iloc[-1]['categoria_produto']

        processed_data['satisfacao_kpis'] = {
            "percentual_5_estrelas": f"{percentual_5_estrelas:.2f}%",
            "nota_media_geral": f"{nota_media_geral:.2f}",
            "categoria_melhor_avaliacao": categoria_melhor_avaliacao,
            "categoria_pior_avaliacao": categoria_pior_avaliacao
        }

        processed_data['satisfacao_distribuicao_avaliacoes'] = satisfacao_distribuicao_avaliacoes_df.to_dict(orient='records')
        processed_data['satisfacao_ranking_completo_categorias'] = satisfacao_ranking_completo_categorias_df.to_dict(orient='records')
        processed_data['satisfacao_ranking_10_melhores_categorias'] = pd.read_csv(os.path.join(DATA_PATH, 'a3', 'satisfacao_ranking_10_melhores_categorias.csv')).to_dict(orient='records')
        processed_data['satisfacao_ranking_10_piores_categorias'] = pd.read_csv(os.path.join(DATA_PATH, 'a3', 'satisfacao_ranking_10_piores_categorias.csv')).to_dict(orient='records')
        print("Dados de Análise de Satisfação (a3) carregados.")
    except Exception as e:
        print(f"ERRO ao carregar dados de Satisfação (a3): {e}")
        processed_data.update({
            'satisfacao_kpis': {}, 'satisfacao_distribuicao_avaliacoes': [], 'satisfacao_ranking_completo_categorias': [],
            'satisfacao_ranking_10_melhores_categorias': [], 'satisfacao_ranking_10_piores_categorias': []
        })

    # Análise 4: Financeira
    try:
        financeiro_lucratividade_por_categoria_df = pd.read_csv(os.path.join(DATA_PATH, 'a4', 'financeiro_lucratividade_por_categoria.csv'))
        financeiro_pareto_receita_pos_frete_df = pd.read_csv(os.path.join(DATA_PATH, 'a4', 'financeiro_pareto_receita_pos_frete.csv'))

        # Calcula e formata os KPIs para a página financeira.
        receita_bruta_total = financeiro_lucratividade_por_categoria_df['receita_bruta'].sum()
        receita_liquida_total_pos_frete = financeiro_lucratividade_por_categoria_df['receita_liquida_pos_frete'].sum()
        margem_media_pos_frete = (receita_liquida_total_pos_frete / receita_bruta_total) * 100 if receita_bruta_total > 0 else 0
        num_categorias_80_receita = len(financeiro_pareto_receita_pos_frete_df)

        processed_data['financeiro_kpis'] = {
            "receita_bruta_total": f"R$ {receita_bruta_total:,.2f}",
            "receita_liquida_total_pos_frete": f"R$ {receita_liquida_total_pos_frete:,.2f}",
            "margem_media_pos_frete": f"{margem_media_pos_frete:.2f}%",
            "num_categorias_80_receita": f"{num_categorias_80_receita} Categorias"
        }
        
        processed_data['pareto_receita_pos_frete'] = financeiro_pareto_receita_pos_frete_df.to_dict(orient='records')
        processed_data['financeiro_receita_bruta_para_histograma'] = pd.read_csv(os.path.join(DATA_PATH, 'a4', 'financeiro_receita_bruta_para_histograma.csv')).to_dict(orient='records')
        processed_data['financeiro_receita_bruta_quartis_limiar'] = pd.read_csv(os.path.join(DATA_PATH, 'a4', 'financeiro_receita_bruta_quartis_limiar.csv')).to_dict(orient='records')
        processed_data['financeiro_composicao_receita_maior_impacto'] = pd.read_csv(os.path.join(DATA_PATH, 'a4', 'financeiro_composicao_receita_maior_impacto.csv')).to_dict(orient='records')
        processed_data['financeiro_maiores_margens_categorias'] = pd.read_csv(os.path.join(DATA_PATH, 'a4', 'financeiro_maiores_margens_categorias.csv')).to_dict(orient='records')
        print("Dados de Análise Financeira (a4) carregados.")
    except Exception as e:
        print(f"ERRO ao carregar dados Financeiros (a4): {e}")
        processed_data.update({
            'financeiro_kpis': {}, 'pareto_receita_pos_frete': [], 'financeiro_receita_bruta_para_histograma': [],
            'financeiro_receita_bruta_quartis_limiar': [], 'financeiro_composicao_receita_maior_impacto': [],
            'financeiro_maiores_margens_categorias': []
        })

    # Análise 5: Marketing
    try:
        marketing_conversion_by_state_df = pd.read_csv(os.path.join(DATA_PATH, 'a5', 'marketing_conversion_by_state.csv'))
        marketing_conversion_by_payment_type_final_df = pd.read_csv(os.path.join(DATA_PATH, 'a5', 'marketing_conversion_by_payment_type_final.csv'))

        # Calcula e formata os KPIs para a página de marketing.
        taxa_conversao_media_nacional = (marketing_conversion_by_state_df['delivered_orders'].sum() / marketing_conversion_by_state_df['total_orders'].sum() * 100) if marketing_conversion_by_state_df['total_orders'].sum() > 0 else 0
        estado_maior_conversao = marketing_conversion_by_state_df.sort_values(by='conversion_rate', ascending=False).iloc[0]
        tipo_pagamento_maior_conversao = marketing_conversion_by_payment_type_final_df.sort_values(by='conversion_rate', ascending=False).iloc[0]

        processed_data['marketing_kpis'] = {
            "taxa_conversao_media_nacional": f"{taxa_conversao_media_nacional:.2f}%",
            "estado_maior_conversao": f"{estado_maior_conversao['customer_state']} ({estado_maior_conversao['conversion_rate']:.2f}%)",
            "tipo_pagamento_maior_conversao": f"{tipo_pagamento_maior_conversao['payment_type']} ({tipo_pagamento_maior_conversao['conversion_rate']:.2f}%)"
        }

        processed_data['marketing_data_estados_maior_volume'] = pd.read_csv(os.path.join(DATA_PATH, 'a5', 'marketing_data_estados_maior_volume.csv')).to_dict(orient='records')
        processed_data['marketing_conversion_by_payment_type_final'] = marketing_conversion_by_payment_type_final_df.to_dict(orient='records')
        print("Dados de Análise de Marketing (a5) carregados.")
    except Exception as e:
        print(f"ERRO ao carregar dados de Marketing (a5): {e}")
        processed_data.update({
            'marketing_kpis': {}, 'marketing_data_estados_maior_volume': [], 'marketing_conversion_by_payment_type_final': []
        })

    print("\nPré-processamento de dados concluído. API pronta.")


# =====================================================================================
# Endpoints da API
# =====================================================================================

@app.get("/api/v1/page1_vendas", tags=["Páginas do Dashboard"])
async def get_vendas_data():
    """Serve os dados para a página de Análise de Vendas."""
    return {
        "kpis": processed_data.get('vendas_kpis', {}),
        "ranking_geral_categorias": processed_data.get('vendas_ranking_geral', []),
        "pareto_analise_vendas": processed_data.get('vendas_pareto_analise', []),
        "sazonalidade_mensal_principais": processed_data.get('vendas_sazonalidade_mensal_principais', []),
        "sazonalidade_trimestral_principais": processed_data.get('vendas_sazonalidade_trimestral_principais', [])
    }

@app.get("/api/v1/page2_logistica", tags=["Páginas do Dashboard"])
async def get_logistica_data():
    """Serve os dados para a página de Análise de Logística."""
    return {
        "kpis": processed_data.get('logistica_kpis', {}),
        "proporcao_atrasos": processed_data.get('logistica_proporcao_atrasos', []),
        "atraso_por_estado": processed_data.get('logistica_atraso_por_estado', []),
        "satisfacao_vs_atraso": processed_data.get('logistica_satisfacao_vs_atraso', []),
        "atraso_por_tipo_entrega": processed_data.get('logistica_atraso_por_tipo_entrega', []),
        "pareto_atrasos_por_categoria": processed_data.get('logistica_pareto_atrasos_por_categoria', []),
        "sazonalidade_atrasos": processed_data.get('logistica_sazonalidade_atrasos', []),
        "impacto_metodo_pagamento": processed_data.get('logistica_impacto_metodo_pagamento', [])
    }

@app.get("/api/v1/page3_satisfacao", tags=["Páginas do Dashboard"])
async def get_satisfacao_data():
    """Serve os dados para a página de Análise de Satisfação do Cliente."""
    return {
        "kpis": processed_data.get('satisfacao_kpis', {}),
        "distribuicao_avaliacoes": processed_data.get('satisfacao_distribuicao_avaliacoes', []),
        "ranking_completo_categorias": processed_data.get('satisfacao_ranking_completo_categorias', []),
        "ranking_10_melhores_categorias": processed_data.get('satisfacao_ranking_10_melhores_categorias', []),
        "ranking_10_piores_categorias": processed_data.get('satisfacao_ranking_10_piores_categorias', [])
    }

@app.get("/api/v1/page4_financeiro", tags=["Páginas do Dashboard"])
async def get_financeiro_data():
    """Serve os dados para a página de Análise Financeira."""
    return {
        "kpis": processed_data.get('financeiro_kpis', {}),
        "pareto_receita_pos_frete": processed_data.get('pareto_receita_pos_frete', []),
        "receita_bruta_para_histograma": processed_data.get('financeiro_receita_bruta_para_histograma', []),
        "receita_bruta_quartis_limiar": processed_data.get('financeiro_receita_bruta_quartis_limiar', []),
        "composicao_receita_maior_impacto": processed_data.get('financeiro_composicao_receita_maior_impacto', []),
        "maiores_margens_categorias": processed_data.get('financeiro_maiores_margens_categorias', [])
    }

@app.get("/api/v1/page5_marketing", tags=["Páginas do Dashboard"])
async def get_marketing_data():
    """Serve os dados para a página de Análise de Marketing."""
    return {
        "kpis": processed_data.get('marketing_kpis', {}),
        "data_estados_maior_volume": processed_data.get('marketing_data_estados_maior_volume', []),
        "conversion_by_payment_type_final": processed_data.get('marketing_conversion_by_payment_type_final', [])
    }

@app.get("/api/v1/mapa_brasil", tags=["Dados Geoespaciais"])
async def get_mapa():
    """Serve os dados geoespaciais dos estados do Brasil em formato GeoJSON."""
    return Response(content=geojson_data, media_type="application/json")


# =====================================================================================
# Servidor de Arquivos Estáticos e Rota Principal
# =====================================================================================

# Monta o diretório 'frontend' para servir arquivos estáticos (CSS, JS, HTML).
app.mount("/static", StaticFiles(directory=FRONTEND_PATH), name="static")

@app.get("/", tags=["Frontend"])
async def read_root():
    """Serve a página principal do dashboard (index.html)."""
    return FileResponse(os.path.join(FRONTEND_PATH, 'index.html'))
