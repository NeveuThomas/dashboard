// Constants
const API_KEY = '120c3a2b3cedf1ee7d8c6f124d039564';
const STATION_ID = '940GZZLUECM'; // Ealing Common station ID

async function getArrivals() {
    try {
        const response = await fetch(
            `https://api.tfl.gov.uk/StopPoint/${STATION_ID}/Arrivals`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Sort arrivals by time
        const sortedArrivals = data.sort((a, b) => 
            new Date(a.expectedArrival) - new Date(b.expectedArrival)
        );

        displayArrivals(sortedArrivals);
    } catch (error) {
        console.error('Error fetching arrivals:', error);
        document.getElementById('arrivals-container').innerHTML = 
            'Error loading arrival times. Please try again later.';
    }
}

function displayArrivals(arrivals) {
    const container = document.getElementById('arrivals-container');
    const existingCards = Array.from(container.querySelectorAll('.train-card'));
    
    if (arrivals.length === 0) {
        container.innerHTML = 'No arrivals found.';
        return;
    }

    // Update or create cards
    arrivals.forEach((train, index) => {
        const arrivalTime = new Date(train.expectedArrival);
        const minutes = Math.round((arrivalTime - new Date()) / 60000);
        const lineClass = train.lineName?.toLowerCase().includes('piccadilly') ? 'piccadilly-line' : 'district-line';
        const destinationName = train.destinationName || 'Unknown Destination';
        const cleanDestination = destinationName.replace(' Underground Station', '');

        // Try to find existing card for this train
        const existingCard = existingCards.find(card => card.dataset.trainId === train.id);
        
        if (existingCard) {
            // Update existing card
            const minutesElement = existingCard.querySelector('.minutes');
            const currentMinutes = parseInt(minutesElement.textContent);
            
            if (currentMinutes !== minutes) {
                minutesElement.textContent = minutes;
            }

            // Remove from existingCards array so we know it's been handled
            existingCards.splice(existingCards.indexOf(existingCard), 1);
            
            // Update position if needed
            if (existingCard.parentElement.children[index] !== existingCard) {
                container.insertBefore(existingCard, container.children[index]);
            }
        } else {
            // Create new card
            const newCard = document.createElement('div');
            newCard.className = `train-card ${lineClass}`;
            newCard.dataset.trainId = train.id;
            newCard.innerHTML = `
                <div class="train-info">
                    <div class="destination">${cleanDestination}</div>
                    <div>Line: ${train.lineName || 'Unknown Line'}</div>
                    <div>Platform: ${train.platformName || train.platform || 'N/A'}</div>
                </div>
                <div class="time-display">
                    <span class="minutes">${minutes}</span>
                    <span class="min-label">min</span>
                </div>
            `;
            
            // Insert at correct position
            if (container.children[index]) {
                container.insertBefore(newCard, container.children[index]);
            } else {
                container.appendChild(newCard);
            }
        }
    });

    // Remove cards that are no longer present
    existingCards.forEach(card => {
        card.classList.add('removing');
        setTimeout(() => {
            if (card.parentElement) {
                card.parentElement.removeChild(card);
            }
        }, 600);
    });
}

async function getLineStatus() {
    try {
        const response = await fetch(
            `https://api.tfl.gov.uk/Line/district,piccadilly/Status`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayLineStatus(data);
    } catch (error) {
        console.error('Error fetching line status:', error);
        document.getElementById('line-status').innerHTML = 
            'Error loading line status. Please try again later.';
    }
}

function displayLineStatus(lineStatuses) {
    const container = document.getElementById('line-status');
    const statusHTML = lineStatuses.map(line => {
        const status = line.lineStatuses[0];
        const isGoodService = status.statusSeverity === 10;
        
        return `
            <div class="status-card ${isGoodService ? 'good-service' : 'disruption'}">
                <strong>${line.name} Line:</strong> ${status.statusSeverityDescription}
                ${!isGoodService ? `<br>${status.reason}` : ''}
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="info-card">
            <h2>Line Status</h2>
            ${statusHTML}
        </div>
    `;
}

// Update the initialize function to handle the first load differently
let isFirstLoad = true;

async function initialize() {
    try {
        const [arrivalsResponse, lineStatusResponse] = await Promise.all([
            getArrivals(),
            getLineStatus()
        ]);
        
        // Don't animate on first load
        if (isFirstLoad) {
            isFirstLoad = false;
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Initial load
initialize();

// Update both arrivals and line status every 30 seconds
setInterval(initialize, 30000); 