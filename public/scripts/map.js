// Map Page JavaScript

let map;
let markers = [];
let heatmapLayer = null;
let ambientSoundEnabled = true;
let currentSound = null;
let currentTileLayer;


let currentLanguage =
    localStorage.getItem("language") || "en";



const sampleVillages = [
{
    name: {
        en: "Sundarbans Village",
        hi: "सुंदरबन गांव",
        mr: "सुंदरबन गाव"
    },
    coordinates: [21.9497, 88.8156],
    traditions: {
        en: ["Folk tales about tigers", "Traditional fishing methods", "Honey collection rituals"],
        hi: ["बाघों की लोककथाएँ", "पारंपरिक मछली पकड़ने की विधियाँ", "शहद संग्रह अनुष्ठान"],
        mr: ["वाघांच्या लोककथा", "पारंपरिक मासेमारी पद्धती", "मध संकलन विधी"]
    },
    festivals: {
        en: ["Bonbibi Puja", "Honey Festival"],
        hi: ["बोनबिबी पूजा", "हनी फेस्टिवल"],
        mr: ["बोनबिबी पूजा", "हनी फेस्टिवल"]
    },
    crafts: {
        en: ["Coconut shell crafts", "Traditional boat making"],
        hi: ["नारियल शिल्प", "पारंपरिक नाव निर्माण"],
        mr: ["नारळ हस्तकला", "पारंपरिक होडी निर्मिती"]
    },
    description: {
        en: "A village in the Sundarbans known for its unique relationship with nature and tigers.",
        hi: "सुंदरबन का एक गांव जो प्रकृति और बाघों के साथ अपने अनोखे संबंध के लिए प्रसिद्ध है।",
        mr: "निसर्ग आणि वाघांशी असलेल्या अनोख्या नात्यासाठी प्रसिद्ध गाव."
    },
    ambientSound: "birds"
},

{
    name: {
        en: "Kantha Village, Bengal",
        hi: "कांथा गांव, बंगाल",
        mr: "कांथा गाव, बंगाल"
    },
    coordinates: [22.5726, 88.3639],
    traditions: {
        en: ["Kantha embroidery", "Oral storytelling", "Traditional songs"],
        hi: ["कांथा कढ़ाई", "मौखिक कथाएँ", "पारंपरिक गीत"],
        mr: ["कांथा भरतकाम", "लोककथा", "पारंपरिक गीते"]
    },
    festivals: {
        en: ["Durga Puja", "Kali Puja"],
        hi: ["दुर्गा पूजा", "काली पूजा"],
        mr: ["दुर्गा पूजा", "काली पूजा"]
    },
    crafts: {
        en: ["Kantha stitch work", "Traditional sarees"],
        hi: ["कांथा सिलाई", "पारंपरिक साड़ियाँ"],
        mr: ["कांथा शिवणकाम", "पारंपरिक साड्या"]
    },
    description: {
        en: "Famous for Kantha embroidery, where old saris are layered and stitched.",
        hi: "कांथा कढ़ाई के लिए प्रसिद्ध, जिसमें पुरानी साड़ियों को जोड़कर सुंदर डिज़ाइन बनाए जाते हैं।",
        mr: "कांथा भरतकामासाठी प्रसिद्ध."
    },
    ambientSound: "flute"
},

{
    name: {
        en: "Madhubani Village, Bihar",
        hi: "मधुबनी गांव, बिहार",
        mr: "मधुबनी गाव, बिहार"
    },
    coordinates: [26.3537, 86.0719],
    traditions: {
        en: ["Madhubani painting", "Mithila art", "Folk songs"],
        hi: ["मधुबनी चित्रकला", "मिथिला कला", "लोकगीत"],
        mr: ["मधुबनी चित्रकला", "मिथिला कला", "लोकगीते"]
    },
    festivals: {
        en: ["Chhath Puja", "Teej"],
        hi: ["छठ पूजा", "तीज"],
        mr: ["छठ पूजा", "तीज"]
    },
    crafts: {
        en: ["Madhubani paintings", "Traditional pottery"],
        hi: ["मधुबनी पेंटिंग", "मिट्टी के बर्तन"],
        mr: ["मधुबनी चित्रे", "मातीची भांडी"]
    },
    description: {
        en: "Home to the world-famous Madhubani paintings.",
        hi: "विश्व प्रसिद्ध मधुबनी चित्रकला का केंद्र।",
        mr: "जगप्रसिद्ध मधुबनी चित्रकलेचे केंद्र."
    },
    ambientSound: "flute"
},

{
    name: {
        en: "Dokra Village, Chhattisgarh",
        hi: "डोकरा गांव, छत्तीसगढ़",
        mr: "डोकरा गाव, छत्तीसगड"
    },
    coordinates: [21.2787, 81.8661],
    traditions: {
        en: ["Dokra metal craft", "Tribal dances", "Harvest songs"],
        hi: ["डोकरा धातु कला", "जनजातीय नृत्य", "फसल गीत"],
        mr: ["डोकरा धातुकाम", "आदिवासी नृत्य", "पीक गीते"]
    },
    festivals: {
        en: ["Bastar Dussehra", "Harvest Festival"],
        hi: ["बस्तर दशहरा", "फसल उत्सव"],
        mr: ["बस्तर दसरा", "पीक उत्सव"]
    },
    crafts: {
        en: ["Dokra metalwork", "Bamboo crafts"],
        hi: ["डोकरा धातुकला", "बांस शिल्प"],
        mr: ["डोकरा धातुकाम", "बांबू हस्तकला"]
    },
    description: {
        en: "Known for Dokra metal casting.",
        hi: "डोकरा धातु ढलाई कला के लिए प्रसिद्ध।",
        mr: "डोकरा धातुकामासाठी प्रसिद्ध."
    },
    ambientSound: "birds"
}
];

function getTranslation() {
    return translations[currentLanguage];
}

function translatePage() {
    const t = getTranslation();

    document.querySelector(".map-header h2").textContent =
        t.mapTitle;

    document.querySelector(".map-header p").textContent =
        t.mapDescription;

    document.getElementById("village-name").textContent =
        t.selectVillage;

    document.getElementById("info-content").innerHTML =
        `<p>${t.clickVillage}</p>`;

    const heatmapBtn =
        document.getElementById("toggle-heatmap");

    if (heatmapLayer) {
        heatmapBtn.textContent =
            t.hideHeatmap;
    } else {
        heatmapBtn.textContent =
            t.toggleHeatmap;
    }

    document.getElementById("toggle-sound")
        .textContent =
        ambientSoundEnabled
            ? t.soundOn
            : t.soundOff;
}

// document.addEventListener('DOMContentLoaded', () => {
//     initializeMap();
//     setupEventListeners();
//     loadCulturalItems();
// });

document.addEventListener('DOMContentLoaded', () => {

    const selector =
        document.getElementById("language-selector");

    selector.value = currentLanguage;

    // selector.addEventListener("change", (e) => {

    //     currentLanguage = e.target.value;

    //     localStorage.setItem(
    //         "language",
    //         currentLanguage
    //     );

    //     translatePage();
    // });
    selector.addEventListener("change", (e) => {

    currentLanguage = e.target.value;

    localStorage.setItem(
        "language",
        currentLanguage
    );

    loadMapLayer(currentLanguage);

    translatePage();
    map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
        map.removeLayer(layer);
    }
});

markers = [];

sampleVillages.forEach(village => {
    addVillageMarker(village);
});
});

    initializeMap();
    setupEventListeners();
    loadCulturalItems();
    translatePage();
});


function initializeMap() {
    map = L.map('map').setView([23.0225, 72.5714], 5);

    loadMapLayer(currentLanguage);

    sampleVillages.forEach(village => {
        addVillageMarker(village);
    });
}


function loadMapLayer(language) {

    if (currentTileLayer) {
        map.removeLayer(currentTileLayer);
    }

    // English
    if (language === "en") {

        currentTileLayer = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            {
                attribution:
                    '&copy; OpenStreetMap contributors &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 20
            }
        );

    }
    // Hindi / Marathi
    else {

        currentTileLayer = L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }
        );

    }

    currentTileLayer.addTo(map);
}


function addVillageMarker(village) {

    const marker = L.marker(village.coordinates).addTo(map);

    marker.bindPopup(`
        <div style="color:#1a1a2e;">
            <h3 style="color:#f4a261;">
                ${village.name[currentLanguage]}
            </h3>

            <p>
                ${village.description[currentLanguage]}
            </p>

            <strong>
                ${getTranslation().festivals}:
            </strong>

            ${village.festivals[currentLanguage].join(", ")}
        </div>
    `);

    marker.on('click', () => {
        showVillageInfo(village);
        playAmbientSound(village.ambientSound);
    });

    markers.push({ marker, village });
}

function showVillageInfo(village) {

    const t = getTranslation();

    const infoPanel =
        document.getElementById('village-info');

    const villageName =
        document.getElementById('village-name');

    const infoContent =
        document.getElementById('info-content');

    // villageName.textContent = village.name;
    villageName.textContent =
    village.name[currentLanguage];

    infoContent.innerHTML = `
        <p>
            <strong>${t.description}:</strong>
           
            ${village.description[currentLanguage]}
        </p>

        <div class="village-details">

            <div class="detail-item">
                <h4>🎭 ${t.traditions}</h4>
              ${village.traditions[currentLanguage].join(', ')}
            </div>

            <div class="detail-item">
                <h4>🎉 ${t.festivals}</h4>
                ${village.festivals[currentLanguage].join(', ')}
            </div>

            <div class="detail-item">
                <h4>🎨 ${t.crafts}</h4>
                ${village.crafts[currentLanguage].join(', ')}
            </div>

        </div>

        <div style="margin-top:1.5rem;">
            <a href="trails.html"
               class="btn btn-primary">
               ${t.planVisit}
            </a>
        </div>
    `;

    infoPanel.classList.add('active');
}

function playAmbientSound(type) {
    if (!ambientSoundEnabled) return;
    
    // In a real implementation, you would play actual audio files
    // For now, we'll just log it
    console.log(`Playing ambient sound: ${type}`);
    
    // You can integrate actual audio files here
    // const audio = new Audio(`/sounds/${type}.mp3`);
    // audio.loop = true;
    // audio.volume = 0.3;
    // audio.play();
    // currentSound = audio;
}

function setupEventListeners() {
    document.getElementById('close-info').addEventListener('click', () => {
        document.getElementById('village-info').classList.remove('active');
        if (currentSound) {
            currentSound.pause();
            currentSound = null;
        }
    });
    
    document.getElementById('toggle-heatmap').addEventListener('click', toggleHeatmap);
    document.getElementById('toggle-sound').addEventListener('click', toggleSound);
}

function toggleHeatmap() {
    // Simple heatmap visualization using marker intensity
    // In production, use a proper heatmap library
    if (heatmapLayer) {
        map.removeLayer(heatmapLayer);
        heatmapLayer = null;
        document.getElementById('toggle-heatmap')
.textContent =
getTranslation().toggleHeatmap;
    } else {
        // Create a simple visual heatmap effect
        markers.forEach(({ marker, village }) => {
            const intensity = Math.random() * 0.5 + 0.5; // Simulated activity
            const circle = L.circle(village.coordinates, {
                radius: 50000 * intensity,
                fillColor: '#f4a261',
                fillOpacity: 0.3 * intensity,
                color: '#f4a261',
                weight: 1
            }).addTo(map);
            
            if (!heatmapLayer) {
                heatmapLayer = L.layerGroup();
            }
            heatmapLayer.addLayer(circle);
        });
        
        if (heatmapLayer) {
            map.addLayer(heatmapLayer);
        }
      document.getElementById('toggle-heatmap')
.textContent =
getTranslation().hideHeatmap;
    }
}

function toggleSound() {
    ambientSoundEnabled = !ambientSoundEnabled;
  const t = getTranslation();

document.getElementById('toggle-sound')
.textContent =
ambientSoundEnabled
? t.soundOn
: t.soundOff;
    
    if (!ambientSoundEnabled && currentSound) {
        currentSound.pause();
        currentSound = null;
    }
}

async function loadCulturalItems() {
    try {
        const response = await fetch('/api/items');
        const items = await response.json();
        
        // Add markers for cultural items with coordinates
        items.forEach(item => {
            if (item.coordinates && item.coordinates.length === 2) {
                const marker = L.marker(item.coordinates).addTo(map);
                marker.bindPopup(`
                    <div style="color: #1a1a2e;">
                        <h4 style="color: #f4a261;">${item.title}</h4>
                        <p>${item.description}</p>
                        <small>Type: ${item.type}</small>
                    </div>
                `);
            }
        });
    } catch (error) {
        console.error('Error loading cultural items:', error);
    }
}



const backToTopBtn = document.getElementById("backToTopBtn");

// Show button after scrolling
window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        backToTopBtn.classList.add("show");
    } else {
        backToTopBtn.classList.remove("show");
    }
});

// Smooth scroll to top
backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});