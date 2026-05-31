// Inisialisasi peta
var map = L.map("map", {
  center: [1.615623706177382, 99.26134080205264], // Lokasi Kabupaten Tapanuli Selatan
  zoom: 13,
});

// === Basemap ===
var osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap",
}).addTo(map);

var esriSat = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
    attribution: "Tiles © Esri",
  });

var cartoLight = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "&copy; CartoDB",
  subdomains: "abcd",
  maxZoom: 19,
});

var topoMap = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
  attribution: "© OpenTopoMap",
});

// Custom Icon (opsional)
var sekolahIcon = L.icon({
  iconUrl: 'aset/school_marker.png', // opsional
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

var baseMaps = {
  "Open Street Map": osm,
  "Esri World Imagery": esriSat,
  "CartoDB Light": cartoLight,
  "Open Topo Map": topoMap,
};

L.control.layers(baseMaps).addTo(map);

// === Geocoder (Search Box) ===
L.Control.geocoder({
  defaultMarkGeocode: true,
  placeholder: "Cari lokasi...",
  position: "topleft",
}).addTo(map);

// === Scale Bar ===
L.control.scale({ position: "bottomleft", imperial: false }).addTo(map);

// === Geolocation ===
map.locate({ setView: true, maxZoom: 14 });

function onLocationFound(e) {
  L.marker(e.latlng).addTo(map)
    .bindPopup("Lokasi Anda").openPopup();
}

map.on('locationfound', onLocationFound);

// Load data GeoJSON
fetch('sekolah.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, { icon:sekolahIcon });
      },
      onEachFeature: function (feature, layer) {
        const props = feature.properties;
        const popupContent = `


<b>Nama Sekolah:</b> ${props["Nama Sekolah"]}<br>
<b>Status:</b> ${props["Status"]}<br>
<b>Alamat Lengkap:</b> ${props["Alamat Lengkap"]}<br>
<b>Jumlah Siswa:</b> ${props["Jumlah Siswa"]}<br>
<b>Jumlah Guru:</b> ${props["Jumlah Guru"]}<br>
<b>Akreditasi:</b> ${props["Akreditasi"]}<br>
<b>Tahun Berdiri:</b> ${props["Tahun Berdiri"]}<br>
<b>Latitude:</b> ${props["Latitude"]}<br>
<b>Longitude:</b> ${props["Longitude"]}<br>
<b>Link Maps:</b> <a href="https://www.google.com/maps?q=${props["Link Maps"]},${props["Longitude"]}" target="_blank">Lihat di Google Maps</a><br>
`;
         
        layer.bindPopup(popupContent);
      }
    }).addTo(map);
  })
  .catch(err => console.error("Gagal memuat GeoJSON:", err));

// Style umum untuk garis dan polygon
const styleBatasKec = { color: '#ffd47f', weight: 1.5, dashArray: '3' };
const styleBatasKabLine = { color: '#000000', weight: 2, dashArray: '5' };
const styleSungai = { color: '#3399FF', weight: 0.1 };

// Fungsi untuk menentukan warna berdasarkan nama kecamatan
function getColorByKecamatan(name) {
  const colors = {
    'AEKBILAH': 'rgb(233, 68, 53)',
    'ANGKOLA BARAT': 'hsl(63, 66%, 77%)',
    'ANGKOLA SELATAN': 'rgb(54, 190, 220)',
    'ANGKOLA TIMUR':'rgb(23, 197, 125)',
    'ANGKOLASANGKUNUR': '#d623d6',
    'ARSE': 'rgb(223, 141, 194)',
    'BATANGANGKOLA': 'hsl(195, 100%, 50%)',
    'BATANGTORU': 'hsl(0,91%, 48%)',
    'MARANCAR': 'hsl(248, 100%, 50%)',
    'MUARABATANGTORU': 'hsl(178, 77%, 26%)',
    'SAIPARDOLOKHOLE': 'hsl(48,100%,50%)',
    'SAYURMATINGGI': 'hsl(0, 93%, 28%)',
    'SIPIROK': 'hsl(118, 100%, 53%)',
    'TANOTOMBANGANANGKOLA': 'hsl(184, 100%, 79%)',

  };
  return colors[name] || '#999999'; // Warna default jika tidak ada kecocokan
}

// Style jalan berdasarkan klasifikasi "highway"
function styleJalan(feature) {
  const klasifikasi = feature.properties.highway;

  switch (klasifikasi) {
    case 'trunk':
      return { color: 'hsl(0, 91%, 48%)', weight: 2 }; // merah untuk jalan utama
    case 'secondary':
      return { color: 'rgb(226, 95, 13)', weight: 1.5 }; // oranye untuk jalan sekunder
    case 'tertiary':
      return { color: 'rgb(235, 222, 46)', weight: 1 }; // kuning untuk jalan tersier
    default:
      return { color: 'rgba(226, 232, 233, 0.72)', weight: 0.2 }; // abu-abu untuk jalan lainnya
  }
}

// Batas Kecamatan (Polygon)
fetch('data/administrasi.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { 
      style: function(feature) {
        return {
          fillColor: getColorByKecamatan(feature.properties.NAMOBJ),
          fillOpacity: 1,
          color: '#000000',
          weight: 2           
        };
      },
      onEachFeature: function (feature, layer) {
        const namaKecamatan = feature.properties.NAMOBJ;

        // Tambahkan popup jika dibutuhkan
        layer.bindPopup(`<strong>Kecamatan ${namaKecamatan}</strong>`);

        // Tambahkan label di tengah polygon
        const center = layer.getBounds().getCenter();
        const label = L.marker(center, {
          icon: L.divIcon({
            className: 'label-kecamatan',
            html: `<b>${namaKecamatan}</b>`,
            iconSize: [100, 20]
          })
        });
        label.addTo(map);
      }
    }).addTo(map);
  })
  .catch(err => console.error("Gagal memuat GeoJSON:", err));

// Batas Kecamatan (Line)
fetch('data/administrasi.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleBatasKec }).addTo(map);
  });

// Batas Kabupaten (Line)
fetch('data/batas_kabupaten.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleBatasKabLine }).addTo(map);
  });

  // Jalan
fetch('data/jalan.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleJalan }).addTo(map);
  });

// Sungai
fetch('data/sungai.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, { style: styleSungai }).addTo(map);
  });

// ================= LEGENDA =================
var legend = L.control({ position: "bottomright" });

legend.onAdd = function () {
  var div = L.DomUtil.create("div", "legend");

  div.innerHTML = `
    <b>Legenda</b><br>
    🏫 Sekolah<br>
    <span style="color:#f7801e">━━</span> Jalan Arteri<br>
    <span style="color:#c6e20d">━━</span> Jalan Kolektor<br>
    <span style="color:#cf48bd">━━</span> Jalan Lokal<br>
    <span style="color:#cf48bd">━━</span> Jalan Lain<br>
    <span style="color:#3399FF">━━</span> Sungai
  `;

  return div;
};

legend.addTo(map);