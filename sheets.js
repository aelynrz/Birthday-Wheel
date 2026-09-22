const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxkzyRU0UDZDb7i7V2iCKWLt3gxvkC1gjTnL-zhqZUjJ0dq7odK_DN69Yp1M6h49_2MFg/exec";

// 1. Fetch claims from Google Sheets and build the visual table
function updateClaimsTable() {
    const ledgerBody = document.getElementById('mgLedgerBody');
    const noClaimsRow = document.getElementById('mgNoClaimsRow');
    
    // SAFETY GUARD: If HTML components aren't ready on page layout yet, exit cleanly
    if (!ledgerBody) {
        console.warn("Ledger target components missing from the DOM layout tree.");
        return;
    }
    
    fetch(GOOGLE_SCRIPT_URL)
        .then(response => response.json())
        .then(claims => {
            // Remove any old dynamic rows safely
            const dynamicRows = ledgerBody.querySelectorAll('.mg-claim-row');
            dynamicRows.forEach(row => row.remove());
            
            if (!claims || claims.length === 0) {
                if (noClaimsRow) noClaimsRow.style.display = '';
                return;
            }
            
            if (noClaimsRow) noClaimsRow.style.display = 'none';
            
            // Loop backwards so newest spin displays at the top
            claims.reverse().forEach(item => {
                const row = document.createElement('tr');
                row.className = 'mg-claim-row';
                row.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
                row.innerHTML = `
                    <td class="mg-user-cell" style="padding:12px 5px; color:#c9a227; font-weight:600;">👑 ${escapeHTML(item.username)}</td>
                    <td class="mg-gift-cell" style="padding:12px 5px; color:#e3ded5;">🎁 ${escapeHTML(item.giftName)}</td>
                `;
                ledgerBody.appendChild(row);
            });
        })
        .catch(err => console.error("Error reading from Google Sheet ledger:", err));
}

// 2. Save a fresh spin payload straight into Google Sheets
function saveNewGiftClaim(username, giftName) {
    const payload = {
        username: username,
        giftName: giftName
    };
    
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: {
            "Content-Type": "text/plain;charset=utf-8" 
        },
        body: JSON.stringify(payload)
    })
    .then(() => {
        setTimeout(updateClaimsTable, 1000);
    })
    .catch(err => console.error("Error saving claim to Google Sheets:", err));
}

// Helper to escape HTML tags cleanly
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

async function getClaimedGifts() {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL);
        const claims = await response.json();

        return claims.map(claim => ({
            username: claim.username,
            giftName: claim.giftName
        }));
    } catch (error) {
        console.error("Failed to load claims from Google Sheets:", error);
        return [];
    }
}
;