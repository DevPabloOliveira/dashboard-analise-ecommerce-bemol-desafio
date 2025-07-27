

# Dashboard de Análise de E-commerce

> Projeto desenvolvido como solução para o Desafio de Estágio Bemol 2025.

## Índice

  - [Visão Geral](https://www.google.com/search?q=%23vis%C3%A3o-geral)
  - [Principais Análises e Funcionalidades](https://www.google.com/search?q=%23principais-an%C3%A1lises-e-funcionalidades)
  - [Pilha de Tecnologias (Tech Stack)](https://www.google.com/search?q=%23pilha-de-tecnologias-tech-stack)
  - [Instalação e Execução Local](https://www.google.com/search?q=%23instala%C3%A7%C3%A3o-e-execu%C3%A7%C3%A3o-local)


## Visão Geral

Este projeto consiste em um dashboard interativo para a análise de dados de uma operação de e-commerce. A aplicação é construída com uma arquitetura que desacopla o backend do frontend, utilizando Python com FastAPI para o processamento de dados e exposição de endpoints via API REST. O frontend é desenvolvido com HTML5, CSS3 e JavaScript puro (Vanilla JS), consumindo a API para renderizar visualizações de dados dinâmicas no estilo SPA (Single-Page Application).

## Principais Análises e Funcionalidades

O dashboard apresenta análises divididas em cinco seções estratégicas:

  * **Vendas:** Ranking de categorias por volume, análise de Pareto (80/20) e performance de vendas com sazonalidade mensal e trimestral.
  * **Logística:** Cálculo do tempo médio de entrega, mapa coroplético de atrasos por estado e análise dos fatores que impactam a eficiência logística.
  * **Satisfação do Cliente:** Distribuição quantitativa das avaliações (1 a 5 estrelas) e ranking das categorias com as melhores e piores notas médias.
  * **Financeiro:** Análise de lucratividade por categoria, Pareto de receita líquida e composição da receita bruta versus custo de frete.
  * **Marketing:** Estudo da taxa de conversão de vendas por estado e por método de pagamento, focando nos maiores volumes de transações.

## Pilha de Tecnologias (Tech Stack)

#### **Backend**

  * **Python 3**
  * **FastAPI:** Framework para a construção da API.
  * **Uvicorn:** Servidor ASGI para execução da aplicação.
  * **Pandas:** Para manipulação e análise dos dados.
  * **Geopandas:** Para processamento dos dados geoespaciais.

#### **Frontend**

  * **HTML5 / CSS3**
  * **JavaScript (ES6+):** Para manipulação do DOM e lógica da interface.
  * **Chart.js:** Biblioteca para a criação dos gráficos interativos.
  * **Leaflet.js:** Biblioteca para a criação do mapa coroplético.

## Instalação e Execução Local

### **Pré-requisitos**

  * Python 3.8+
  * Git

### **Passos para Instalação**

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/seu-usuario/dashboard-analise-ecommerce-bemol-desafio.git
    ```

2.  **Navegue até a pasta do projeto:**

    ```bash
    cd dashboard-analise-ecommerce-bemol-desafio
    ```

3.  **Crie e ative um ambiente virtual:**

      * Este passo isola as dependências do projeto.

    <!-- end list -->

    ```bash
    # Criar o ambiente
    python -m venv venv

    # Ativar no Windows
    .\venv\Scripts\activate

    # Ativar no macOS/Linux
    source venv/bin/activate
    ```

4.  **Instale as dependências Python:**

    ```bash
    pip install -r requirements.txt
    ```

5.  **Inicie o servidor da API:**

      * O servidor Uvicorn iniciará a aplicação. A flag `--reload` reinicia o servidor automaticamente a cada alteração no código.

    <!-- end list -->

    ```bash
    uvicorn main:app --reload
    ```

6.  **Acesse o Dashboard:**

      * Após iniciar o servidor, a aplicação estará disponível em: **[http://127.0.0.1:8000](https://www.google.com/search?q=http://127.0.0.1:8000)**
