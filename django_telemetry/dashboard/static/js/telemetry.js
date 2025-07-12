document.addEventListener("DOMContentLoaded", () => {
    // --- CONFIGURATION ---
    const MAX_CHART_POINTS = 100;
    const POLLING_INTERVAL_MS = 5000;
    const GAUGE_OPTIONS = {
        angle: 0.15, lineWidth: 0.44, radiusScale: 1,
        pointer: { length: 0.6, strokeWidth: 0.035, color: '#000000' },
        limitMax: false, limitMin: false,
        staticZones: [
           {strokeStyle: "#F03E3E", min: -90, max: -45},
           {strokeStyle: "#FFDD00", min: -45, max: 45},
           {strokeStyle: "#30B32D", min: 45, max: 90}
        ],
        strokeColor: '#E0E0E0', generateGradient: true, highDpiSupport: true,
    };

    // --- DOM ELEMENTS ---
    const timestampEl = document.getElementById("timestamp");
    const pitchTextEl = document.getElementById("pitch-text");
    const rollTextEl = document.getElementById("roll-text");
    const yawTextEl = document.getElementById("yaw-text");
    const exportBtn = document.getElementById('export-csv');

    // --- STATE VARIABLES ---
    let batteryChart, map, polyline, droneMarker;
    let pitchGauge, rollGauge, yawGauge;

    // --- INITIALIZATION ---

    function initGauges() {
        pitchGauge = new Gauge(document.getElementById('pitch-gauge')).setOptions(GAUGE_OPTIONS);
        rollGauge = new Gauge(document.getElementById('roll-gauge')).setOptions(GAUGE_OPTIONS);
        
        // Yaw gauge has a different range (0-360)
        const yawOptions = {...GAUGE_OPTIONS, staticZones: [
            {strokeStyle: "#30B32D", min: 0, max: 360}
        ]};
        yawGauge = new Gauge(document.getElementById('yaw-gauge')).setOptions(yawOptions);

        pitchGauge.maxValue = 90; pitchGauge.setMinValue(-90); pitchGauge.set(0);
        rollGauge.maxValue = 180; rollGauge.setMinValue(-180); rollGauge.set(0);
        yawGauge.maxValue = 360; yawGauge.setMinValue(0); yawGauge.set(0);
    }

    function initMap() {
        map = L.map('map').setView([28.45, 76.80], 15);
        polyline = L.polyline([], { color: 'royalblue', weight: 3 }).addTo(map);
        
        // Custom drone icon
        const droneIcon = L.divIcon({
            className: 'drone-icon',
            iconSize: [35, 35], // Updated size
            iconAnchor: [17.5, 17.5] // Updated anchor
        });
        droneMarker = L.marker([28.45, 76.80], {icon: droneIcon}).addTo(map); // Initial position
        setMapTheme();
    }
    
    function initChart() {
        const ctx = document.getElementById("batteryChart").getContext("2d");
        batteryChart = new Chart(ctx, {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Battery Voltage (V)', data: [], borderColor: 'rgba(25, 135, 84, 1)', borderWidth: 2, fill: false, tension: 0.4 }] },
            options: { responsive: true, scales: { y: { beginAtZero: false } }, animation: { duration: 250 }, plugins: { legend: { display: false } } }
        });
    }

    // --- DATA HANDLING ---

    // Fetches the initial batch of 100 data points to populate the dashboard
    function fetchInitialData() {
        fetch("/api/telemetry/100")
            .then(res => res.json())
            .then(data => {
                if (!data || data.length === 0) return;

                // Chart data
                const labels = data.map(d => new Date(d.timestamp).toLocaleTimeString()).reverse();
                const battery = data.map(d => d.battery_voltage).reverse();
                batteryChart.data.labels = labels;
                batteryChart.data.datasets[0].data = battery;
                batteryChart.update();

                // Map data
                const latlngs = data.map(d => [d.lat, d.lon]).reverse();
                polyline.setLatLngs(latlngs);
                if (latlngs.length > 0) {
                    map.fitBounds(polyline.getBounds(), {padding: [20, 20]}); // Reduced map padding
                    droneMarker.setLatLng(latlngs[latlngs.length - 1]); // Position drone at the latest point
                }

                // Update gauges and text with the very latest point from the batch
                updateUI(data[data.length - 1]);
            }).catch(err => console.error("Failed to fetch initial data:", err));
    }

    // Fetches only the single latest data point
    function fetchLatestData() {
        fetch("/api/telemetry/latest")
            .then(res => res.json())
            .then(data => {
                updateUI(data);
                appendData(data);
            }).catch(err => console.error("Fetch latest error:", err));
    }

    // Appends a new data point to the chart and map
    function appendData(data) {
        const t = new Date(data.timestamp);

        // Append to chart, remove old point if > MAX_CHART_POINTS
        if (batteryChart.data.labels.length >= MAX_CHART_POINTS) {
            batteryChart.data.labels.shift();
            batteryChart.data.datasets[0].data.shift();
        }
        batteryChart.data.labels.push(t.toLocaleTimeString());
        batteryChart.data.datasets[0].data.push(data.battery_voltage);
        batteryChart.update('none'); // Update without animation

        // Append to map and move drone marker
        const latlng = [data.lat, data.lon];
        polyline.addLatLng(latlng);
        map.panTo(latlng);
        droneMarker.setLatLng(latlng); // Move drone marker
    }
    
    // Updates all UI elements that show the latest value (gauges, text)
    function updateUI(data) {
        if (!data) return;
        const t = new Date(data.timestamp);
        timestampEl.innerText = t.toLocaleString();

        pitchGauge.set(data.pitch);
        pitchTextEl.textContent = `Pitch: ${data.pitch.toFixed(2)}°`;
        
        rollGauge.set(data.roll);
        rollTextEl.textContent = `Roll: ${data.roll.toFixed(2)}°`;

        yawGauge.set(data.yaw);
        yawTextEl.textContent = `Yaw: ${data.yaw.toFixed(2)}°`;
    }

    // --- UI HELPERS ---

    function setMapTheme() {
        const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
        const tileUrl = isDark
            ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        
        // Remove existing tile layers before adding a new one
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        L.tileLayer(tileUrl, { maxZoom: 18, attribution: '© OpenStreetMap, © CARTO' }).addTo(map);
    }

    function toggleDarkMode() {
        const newTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Reload map tiles to match the new theme
        setMapTheme();
    }

    function exportToCSV() {
        const data = batteryChart.data;
        if (data.labels.length === 0) {
            alert("No data to export.");
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,Timestamp,BatteryVoltage\n";
        data.labels.forEach((label, index) => {
            csvContent += `${label},${data.datasets[0].data[index]}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "telemetry_data.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // --- EVENT LISTENERS ---
    document.getElementById('darkToggle').addEventListener('click', toggleDarkMode);
    exportBtn.addEventListener('click', exportToCSV);

    // --- EXECUTION ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
    }
    
    initGauges();
    initMap();
    initChart();
    
    // Load initial data, then start polling for the latest
    fetchInitialData();
    setInterval(fetchLatestData, POLLING_INTERVAL_MS);
});