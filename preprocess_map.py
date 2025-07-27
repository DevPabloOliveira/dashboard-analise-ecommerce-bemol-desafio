import pandas as pd
import geopandas as gpd
import os

print("Iniciando pré-processamento do mapa...")

# Define os caminhos
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_UF_PATH = os.path.join(BASE_DIR, 'data_uf')
INPUT_CSV = os.path.join(DATA_UF_PATH, 'br_geobr_mapas_uf.csv')
OUTPUT_GEOJSON = os.path.join(DATA_UF_PATH, 'brazil_states.geojson')

sigla_para_estado = {
    'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
    'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
    'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
    'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
    'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
    'SE': 'Sergipe', 'TO': 'Tocantins'
}

try:
    # Lógica de conversão copiada do main.py
    map_df = pd.read_csv(INPUT_CSV)
    map_df['geometria'] = gpd.GeoSeries.from_wkt(map_df['geometria'])
    gdf = gpd.GeoDataFrame(map_df, geometry='geometria')
    gdf = gdf.dissolve(by='sigla_uf').reset_index()
    gdf['nome_estado'] = gdf['sigla_uf'].map(sigla_para_estado)

    gdf = gdf.set_crs(epsg=4674, allow_override=True)
    gdf = gdf.to_crs(epsg=4326)

    # Salva o resultado em um arquivo GeoJSON
    gdf.to_file(OUTPUT_GEOJSON, driver='GeoJSON')

    print(f"Sucesso! Mapa salvo em: {OUTPUT_GEOJSON}")

except Exception as e:
    print(f"Ocorreu um erro: {e}")