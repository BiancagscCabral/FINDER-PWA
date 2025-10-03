
let map;
let userCoords = { lat: 0, lon: 0 };
let allPlaces = []; 
const markers = [];

const findBtn = document.getElementById("findBtn");
const resultsList = document.getElementById("results");
const filtersContainer = document.getElementById("filters");
const loader = document.getElementById("loader");

// Tipos de locais 
const placeTypes = {
    supermarket: 'node["shop"="supermarket"]',
    pharmacy: 'node["amenity"="pharmacy"]',
    hardware: 'node["shop"="hardware"]',
    bakery: 'node["shop"="bakery"]',
    barber: 'node["shop"~"hairdresser|barber"]', 
    beauty: 'node["shop"="beauty"]',
    fast_food: 'node["amenity"="fast_food"]',
};

// Calcula a distância 
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distância em km
}


function buildOverpassQuery(lat, lon, radius = 2000) {
    let queryParts = Object.values(placeTypes).map(type => `${type}(around:${radius},${lat},${lon});`).join('\n');
    return `
    [out:json];
    (
      ${queryParts}
    );
    out body; 
    `;
}

// Inicializa o mapa 
function initMap(lat, lon) {
    if (map) { 
        map.setView([lat, lon], 15);
    } else { 
        map = L.map('map').setView([lat, lon], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);
    }
    L.marker([lat, lon]).addTo(map).bindPopup("<b>Você está aqui</b>").openPopup();
}

// Exibe os locais e horários(se informado)
function displayPlaces(filter = 'all') {
    resultsList.innerHTML = "";
    markers.forEach(m => map.removeLayer(m));
    markers.length = 0;

    const filteredPlaces = (filter === 'all')
        ? allPlaces
        : allPlaces.filter(p => p.type === filter);
    
    filteredPlaces.sort((a, b) => a.distance - b.distance);

    if (filteredPlaces.length === 0) {
        resultsList.innerHTML = '<li>Nenhum local encontrado para este filtro.</li>';
        return;
    }

    filteredPlaces.forEach(place => {
        const li = document.createElement("li");
        li.className = 'place-card';
        const distanceText = place.distance < 1
            ? `${(place.distance * 1000).toFixed(0)} m`
            : `${place.distance.toFixed(1)} km`;
        
        li.innerHTML = `
            <div class="card-header">
                <h3>${place.name}</h3>
                <span class="place-status ${place.status.class}">${place.status.text}</span>
            </div>
            <p class="category">${place.category}</p>
            <p class="distance">📍 Aprox. ${distanceText}</p>
            <p class="hours">${place.hoursText}</p>
        `;
        resultsList.appendChild(li);

        const marker = L.marker([place.lat, place.lon]).addTo(map);
        marker.bindPopup(`<b>${place.name}</b><br>${place.category}`);
        markers.push(marker);
    });
}


async function findPlaces(lat, lon) {
    loader.classList.remove('hidden');
    resultsList.innerHTML = "";
    
    const query = buildOverpassQuery(lat, lon);
    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);
    
    try {
        const response = await fetch(url);
        // Adicionando verificação de erro na resposta da API
        if (!response.ok) {
            throw new Error(`Erro na API Overpass: ${response.statusText}`);
        }
        const data = await response.json();
        
        allPlaces = data.elements.map(el => {
            let type = 'unknown';
            let category = 'Comércio';
            if (el.tags.shop === 'supermarket') { type = 'supermarket'; category = ' Supermercado'; }
            if (el.tags.amenity === 'pharmacy') { type = 'pharmacy'; category = ' Farmácia'; }
            if (el.tags.shop === 'hardware') { type = 'hardware'; category = ' Ferragens'; }
            if (el.tags.shop === 'bakery') { type = 'bakery'; category = ' Padaria'; }
            if (el.tags.shop === 'hairdresser' || el.tags.shop === 'barber') { type = 'barber'; category = ' Barbearia / Salão'; }
            if (el.tags.shop === 'beauty') { type = 'beauty'; category = ' Estética'; }
            if (el.tags.amenity === 'fast_food') { type = 'fast_food'; category = ' Lanchonete'; }

            let status = { text: 'Horário não informado', class: 'unknown' };
            let hoursText = '';

            if (el.tags.opening_hours) {
                try {
                    const oh = new opening_hours(el.tags.opening_hours);
                    const isOpen = oh.isOpen();
                    
                    status.text = isOpen ? 'Aberto' : 'Fechado';
                    status.class = isOpen ? 'open' : 'closed';
                    
                    const now = new Date();
                    const nextChange = oh.getNextChange();
                    if (nextChange) {
                        const diffMinutes = (nextChange - now) / (1000 * 60);
                        if (diffMinutes < 60*24*7) {
                           hoursText = `${isOpen ? 'Fecha' : 'Abre'} às ${nextChange.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
                        }
                    }

                } catch (e) {
                    console.error("Erro ao processar opening_hours:", el.tags.opening_hours, e);
                    status.text = 'Erro ao ler horário';
                }
            }

            return {
                id: el.id,
                name: el.tags.name || "Sem nome",
                lat: el.lat,
                lon: el.lon,
                type: type,
                category: category,
                distance: calculateDistance(userCoords.lat, userCoords.lon, el.lat, el.lon),
                status: status,
                hoursText: hoursText
            };
        });

        displayPlaces();
        filtersContainer.classList.remove('hidden');

    } catch (err) {
        resultsList.innerHTML = "<li>Erro ao buscar locais. Verifique sua conexão ou tente novamente.</li>";
        console.error(err);
    } finally {
        loader.classList.add('hidden');
    }
}

// Event Listeners (sem alterações)
findBtn.addEventListener("click", () => {
    findBtn.disabled = true;
    findBtn.textContent = "Buscando...";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            userCoords = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            initMap(userCoords.lat, userCoords.lon);
            findPlaces(userCoords.lat, userCoords.lon);
            findBtn.style.display = 'none'; 
        }, () => {
            alert("Não foi possível obter a localização. Por favor, habilite a permissão no seu navegador.");
            findBtn.disabled = false;
            findBtn.textContent = "📍 Usar minha localização";
        });
    } else {
        alert("Seu navegador não suporta geolocalização.");
        findBtn.disabled = false;
    }
});

filtersContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
        document.querySelector('.filter-btn.active').classList.remove('active');
        e.target.classList.add('active');
        const filterType = e.target.getAttribute('data-type');
        displayPlaces(filterType);
    }
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registrado!'))
            .catch(err => console.error('Falha ao registrar SW', err));
    });
}