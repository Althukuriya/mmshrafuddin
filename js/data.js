// js/data.js
// Google Sheets CSV URL - YOUR PUBLISHED LINK
const GOOGLE_SHEETS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRmqHEH0b4l4JYMIEM0N6hnH55elmZMKtBie2cDRYGDb_YGMAe0d7ZKe18srlr23ReTJWYv_ECfTSMm/pub?gid=596049360&single=true&output=csv";

// Fallback demo data
const DEMO_VEHICLES = [
    {
        id: 1,
        name: "Honda Bike 2022",
        type: "Bike",
        year: 2022,
        price: 20000,
        image: "https://placehold.co/600x400/0A1929/FFFFFF?text=Honda+Bike",
        images: ["https://placehold.co/600x400/0A1929/FFFFFF?text=Honda+Bike+1"],
        status: "Available",
        youtube: "https://youtu.be/kbPsPv3GyMw"
    },
    {
        id: 2,
        name: "Yamaha Bike 2023",
        type: "Bike",
        year: 2023,
        price: 39000,
        image: "https://placehold.co/600x400/1E88E5/FFFFFF?text=Yamaha+Bike",
        images: ["https://placehold.co/600x400/1E88E5/FFFFFF?text=Yamaha+Bike+1"],
        status: "Available",
        youtube: "https://youtu.be/tRSLXR4lVvg"
    }
];

// Convert Google Drive link to direct image URL
function convertGoogleDriveLink(driveUrl) {
    if (!driveUrl || driveUrl === '') return '';
    
    try {
        // Handle different Google Drive URL formats
        let fileId = '';
        
        if (driveUrl.includes('drive.google.com/open?id=')) {
            fileId = driveUrl.split('open?id=')[1].split('&')[0].split('?')[0];
        } else if (driveUrl.includes('drive.google.com/file/d/')) {
            const match = driveUrl.match(/\/d\/([^\/]+)/);
            if (match) fileId = match[1];
        }
        
        if (fileId) {
            // Return direct image URL
            return `https://drive.google.com/uc?export=view&id=${fileId}`;
        }
    } catch (e) {
        console.warn("Error converting Drive link:", e);
    }
    
    return driveUrl; // Return original if not a Drive link
}

// Main function to fetch vehicles from Google Sheets
async function fetchVehiclesFromSheet() {
    try {
        console.log("📊 Fetching data from Google Sheets...");
        console.log("URL:", GOOGLE_SHEETS_CSV_URL);
        
        // Add cache busting
        const url = GOOGLE_SHEETS_CSV_URL + '&_=' + new Date().getTime();
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log("✅ CSV data received, length:", csvText.length);
        console.log("First 200 chars:", csvText.substring(0, 200));
        
        if (csvText.length < 10) {
            throw new Error("CSV data is too short");
        }
        
        const vehicles = parseCSV(csvText);
        
        if (vehicles.length > 0) {
            console.log(`✅ Successfully loaded ${vehicles.length} vehicles from sheet`);
            console.log("Vehicles:", vehicles);
            return vehicles;
        } else {
            console.log("⚠️ No vehicles found in sheet, using demo data");
            return DEMO_VEHICLES;
        }
    } catch (error) {
        console.error("❌ Error fetching from Google Sheets:", error);
        console.log("⚠️ Using demo data instead");
        return DEMO_VEHICLES;
    }
}

// Parse CSV to vehicle objects
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
        console.log("CSV has no data rows");
        return [];
    }
    
    // Get headers
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    console.log("CSV Headers:", headers);
    
    const vehicles = [];
    
    for (let i = 1; i < lines.length; i++) {
        try {
            // Parse CSV line properly (handling quotes)
            const values = [];
            let currentValue = '';
            let insideQuotes = false;
            
            for (let char of lines[i]) {
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
            values.push(currentValue); // Add last value
            
            // Helper function to get value by column name
            const getValue = (columnName) => {
                const index = headers.findIndex(h => h.includes(columnName) || columnName.includes(h));
                if (index !== -1 && values[index]) {
                    return values[index].replace(/^"|"$/g, '').trim();
                }
                return '';
            };
            
            // Get values
            const name = getValue('Vehicle Name');
            const type = getValue('Vehicle Type');
            const yearStr = getValue('Model Year');
            const priceStr = getValue('Price');
            const youtube = getValue('YouTube');
            
            // Get images and convert Drive links
            const images = [];
            
            // Check all 5 image columns
            for (let imgNum = 1; imgNum <= 5; imgNum++) {
                let imgValue = '';
                
                if (imgNum === 1) {
                    imgValue = getValue('Vehicle Image 1 (Main Image)');
                } else {
                    imgValue = getValue(`Vehicle Image ${imgNum}`);
                }
                
                if (imgValue && imgValue.trim() !== '') {
                    // Convert Google Drive link to direct image URL
                    const directUrl = convertGoogleDriveLink(imgValue);
                    if (directUrl) {
                        images.push(directUrl);
                    }
                }
            }
            
            // Parse year and price
            const year = parseInt(yearStr) || 2023;
            const price = parseFloat(priceStr) || 0;
            
            // Only add if we have valid data
            if (name && name !== 'Vehicle Name' && price > 0) {
                const vehicle = {
                    id: i,
                    name: name,
                    type: type || 'Car',
                    year: year,
                    price: price,
                    image: images.length > 0 ? images[0] : 'https://placehold.co/600x400/0A1929/FFFFFF?text=No+Image',
                    images: images.length > 0 ? images : ['https://placehold.co/600x400/0A1929/FFFFFF?text=No+Image'],
                    status: 'Available', // Default status
                    youtube: youtube || '',
                };
                
                vehicles.push(vehicle);
                console.log(`✅ Added vehicle: ${vehicle.name} with ${images.length} images`);
            }
        } catch (err) {
            console.warn(`Error parsing row ${i}:`, err);
        }
    }
    
    console.log(`📊 Parsed ${vehicles.length} vehicles from CSV`);
    return vehicles;
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
    if (!price) return '₹0';
    return `₹${price.toLocaleString('en-IN')}`;
}
