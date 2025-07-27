window.renderPage7 = async () => {
    console.log("Renderizando Página 7: Visualizador de Notebooks...");

    const notebookListContainer = document.getElementById('notebook-list-container');
    const notebookViewerContainer = document.getElementById('notebook-viewer-container');
    const notebookList = document.querySelector('.notebook-list');
    const notebookTitle = document.getElementById('notebook-title');
    const notebookFrame = document.getElementById('notebook-frame'); 
    const backButton = document.getElementById('back-to-list-button');

    const notebooks = [
        { title: "1. Análise de Performance de Vendas", file: "Pablo Oliveira Desafio 1-a.html" },
        { title: "2. Análise de Logística", file: "Pablo Oliveira Desafio 2-a.html" },
        { title: "3. Análise de Satisfação do Cliente", file: "Pablo Oliveira Desafio 3-a.html" },
        { title: "4. Análise Financeira", file: "Pablo Oliveira Desafio 4-a.html" },
        { title: "5. Análise de Marketing", file: "Pablo Oliveira Desafio 5-a.html" }
    ];

    notebookList.innerHTML = notebooks.map(nb => `
        <li>
            <a href="#" data-file="${nb.file}" data-title="${nb.title}">
                ${nb.title}
                <i class="fa-solid fa-chevron-right"></i>
            </a>
        </li>
    `).join('');

    // Função para mostrar o conteúdo de um notebook
    const showNotebook = (file, title) => {
        notebookListContainer.style.display = 'none';
        notebookViewerContainer.style.display = 'block';
        notebookTitle.textContent = title;
        
        const notebookPath = `/static/notebook/${file}`;
        notebookFrame.src = notebookPath;
    };

    // Função para voltar à lista
    const showList = () => {
        notebookViewerContainer.style.display = 'none';
        notebookListContainer.style.display = 'block';
        // Limpa o src do iframe para interromper qualquer carregamento
        notebookFrame.src = 'about:blank'; 
    };

    // Evento de clique na lista (permanece o mesmo)
    notebookList.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (link) {
            event.preventDefault();
            const file = link.dataset.file;
            const title = link.dataset.title;
            showNotebook(file, title);
        }
    });

    // Evento de clique no botão "Voltar" (permanece o mesmo)
    backButton.addEventListener('click', showList);
};