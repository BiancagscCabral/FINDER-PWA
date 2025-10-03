# FINDER - Localizador de Comércios PWA

Um Progressive Web App (PWA) desenvolvido para ajudar usuários a encontrar comércios e serviços utilitários em sua proximidade de forma rápida e intuitiva. O aplicativo utiliza a geolocalização do dispositivo para buscar dados no OpenStreetMap e exibi-los em uma lista organizada por distância e em um mapa interativo.

## ✨ Funcionalidades Principais

-   **Geolocalização Automática:** Detecta a localização do usuário para fornecer resultados precisos.
-   **Busca por Proximidade:** Utiliza a API Overpass para consultar a base de dados do OpenStreetMap em um raio definido.
-   **Categorias Diversas:** Busca por supermercados, farmácias, padarias, salões de beleza, lanchonetes e mais.
-   **Status de Funcionamento:** Informa se um estabelecimento está "Aberto Agora" ou "Fechado" e exibe o próximo horário de abertura/fechamento.
-   **Mapa Interativo:** Exibe todos os locais encontrados no mapa com marcadores SVG personalizados para cada categoria, usando a biblioteca Leaflet.js.
-   **Instalável (PWA):** Pode ser adicionado à tela inicial do celular e possui capacidades offline básicas graças ao Service Worker.

## 🛠️ Tecnologias Utilizadas

-   **Frontend:** HTML5, CSS3, JavaScript
-   **Mapa:** [Leaflet.js](https://leafletjs.com/)
-   **Dados Geográficos:** [OpenStreetMap](https://www.openstreetmap.org/) via [Overpass API](https://overpass-api.de/)
-   **Análise de Horários:** [opening_hours.js](https://github.com/opening-hours/opening_hours.js)


## 🔮 Melhorias Futuras

-   [ ] Adicionar uma página de detalhes para cada local.
-   [ ] Implementar uma barra de busca por nome ou endereço.
-   [ ] Salvar a última localização pesquisada para agilizar o uso.
-   [ ] Melhorar o tratamento de erros e o feedback para o usuário.

