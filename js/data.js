// js/data.js
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSE1pstK8BTamjt-LTSDJ40d6OdayNmT5NQp1Y4inx6pvMuBQ68at3tbkJDyy6NiqMfOZ1mB9AXE6_v/pub?gid=1146903494&single=true&output=csv";

// Fallback demo data (only used if fetch fails)
const DEMO_VEHICLES = [
    {
        id: 1,
        name: "Honda Bike",
        type: "Bike",
        year: 2022,
        price: 20000,
        image: "https://images.unsplash.com/photo-1609630875171-b1321377ee65",
        images: ["https://images.unsplash.com/photo-1609630875171-b1321377ee65"],
        status: "AVAILABLE",
        youtube: ""
    },
    {
        id: 2,
        name: "Yamaha Bike",
        type: "Bike",
        year: 2023,
        price: 39000,
        image: "https://plus.unsplash.com/premium_photo-1661963005592-182d602c6a3f",
        images: ["https://plus.unsplash.com/premium_photo-1661963005592-182d602c6a3f"],
        status: "SOLD",
        youtube: "https://youtu.be/tRSLXR4lVvg"
    }
];

// MAIN FUNCTION - Uses same method as your working test code
async function fetchVehiclesFromSheet() {
    console.log("🔍 Fetching from Google Sheets...");
    
    try {
        // Add timestamp to prevent caching (like your test code)
        const url = GOOGLE_SHEETS_CSV_URL + '&t=' + Date.now();
        
        const response = await fetch(url);
        const csvText = await response.text();
        
        console.log("✅ Data received, length:", csvText.length);
        
        // Parse CSV exactly like your working test code
        const rows = csvText.trim().split("\n").map(row => {
            // Handle quoted fields properly
            const values = [];
            let currentValue = '';
            let insideQuotes = false;
            
            for (let char of row) {
                if (char === '"' && !insideQuotes) {
                    insideQuotes = true;
                } else if (char === '"' && insideQuotes) {
                    insideQuotes = false;
                } else if (char === ',' && !insideQuotes) {
                    values.push(currentValue);
                    currentValue = '';
                } else {
                    currentValue += char;
                }
            }
            values.push(currentValue);
            return values;
        });
        
        // Remove header row
        rows.shift();
        
        const vehicles = rows.map((row, index) => {
            // Use same indexes as your working test code
            const name = row[1] || 'Unknown';
            const type = row[2] || 'Car';
            const year = parseInt(row[3]) || 2023;
            const price = parseFloat(row[4]) || 0;
            const mainImage = row[5] || '';
            const status = row[11] || 'AVAILABLE';
            const youtube = row[10] || ''; // YouTube link column
            
            // Collect all images
            const images = [];
            if (mainImage) images.push(mainImage);
            if (row[6]) images.push(row[6]); // Image 2
            if (row[7]) images.push(row[7]); // Image 3
            if (row[8]) images.push(row[8]); // Image 4
            if (row[9]) images.push(row[9]); // Image 5
            
            return {
                id: index + 1,
                name: name,
                type: type,
                year: year,
                price: price,
                image: images[0] || 'https://placehold.co/600x400/0A1929/FFFFFF?text=No+Image',
                images: images.length > 0 ? images : ['https://placehold.co/600x400/0A1929/FFFFFF?text=No+Image'],
                status: status,
                youtube: youtube || '',
            };
        });
        
        console.log(`✅ Loaded ${vehicles.length} vehicles`);
        return vehicles;
        
    } catch (error) {
        console.error("❌ Error fetching:", error);
        return DEMO_VEHICLES;
    }
}

// Get YouTube videos from vehicles
function getYouTubeVideosFromVehicles(vehicles) {
    return vehicles
        .filter(v => v.youtube && v.youtube.trim() !== '')
        .slice(0, 3)
        .map(v => ({
            id: v.id,
            title: v.name,
            thumbnail: v.image,
            videoUrl: v.youtube
        }));
}

// Format price in Rupees
function formatPrice(price) {
    return `₹${price.toLocaleString('en-IN')}`;
}
