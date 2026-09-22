//setup and initailise
(function() {
    const STORAGE_KEY = 'wheel_gifts';
    let gifts = [];
    let guestName = '';
    let accumulatedRotation = 0;
    let spinning = false;
    let currentSegments = [];
  
    const gate = document.getElementById('mgGate');
    const nameInput = document.getElementById('mgNameInput');
    const gateBtn = document.getElementById('mgGateBtn');
    const welcome = document.getElementById('mgWelcome');
    const wheelGroup = document.getElementById('mgWheelGroup');
    const wheelSvg = document.getElementById('mgWheelSvg');
    const spinBtn = document.getElementById('mgSpinBtn');
    const emptyNote = document.getElementById('mgEmptyNote');
    const manageBtn = document.getElementById('mgManageBtn');
    const toast = document.getElementById('mgToast');
    
    const MY_GIFT_WISHLIST = [
      "Tamron Lens (17-70mm)",
      "Camera strap",
      "Tripod",
      "Speed light",
      "Camera rig (Sony A6400)",
      "1TB SSD",
      "SanDisk SD Card (16GB and above)",
      "8GB/16GB RAM for Victus Laptop",
      "New Balance 530 (size 40/41)",
      "Thocky Mechanical Keyboard",
      "Trip to Universal Studio",
      "Trip to Korea",
      "Monitor",
      "Study Table",
      "Ergonomic Chair",
      "Wild Card! (Surprise Me)" 
    ];
  
    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1900);
    }
  
    function emojiFor(name) {
      const s = (name || '').toLowerCase();
      if (/tripod|lens|camera|light\b/.test(s)) return '📷';
      if (/trip/.test(s)) return '👜';
      if (/balance|new/.test(s)) return '👟';
      if (/chair|table|monitor|keyboard/.test(s)) return '🎮';
      return '⭐';
    }

 //login and data
 // ---------- NAME GATE ----------
 try {
   const saved = window.name && window.name.startsWith('mgname:') ? window.name.slice(7) : '';
   if (saved && nameInput) nameInput.value = saved;
 } catch(e) {}

 if (gateBtn) {
   gateBtn.onclick = () => {
     const val = nameInput.value.trim();
     if (!val) { nameInput.focus(); showToast('the wheel needs your name first ✦'); return; }
     guestName = val;
     try { window.name = 'mgname:' + val; } catch(e) {}
     if (welcome) {
       welcome.textContent = 'WELCOME, ' + val.toUpperCase() + ' ♠';
       welcome.style.display = 'inline-block';
     }
     if (gate) gate.style.display = 'none';
   };
 }

 if (nameInput) {
   nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') gateBtn.click(); });
 }

 // ---------- STORAGE CONTROLLERS ----------
 async function load() {
  gifts = MY_GIFT_WISHLIST.map((name, index) => ({
      id: 'g_fixed_' + index,
      name: name,
      note: '',
      price: '',
      link: '',
      claimedBy: null,
      emoji: emojiFor(name)
  }));

  const claims = await getClaimedGifts();

  claims.forEach(claim => {
      const gift = gifts.find(g => g.name === claim.giftName);

      if (gift) {
          gift.claimedBy = claim.username;
      }
  });

  buildWheel();
  updateWebsiteLedger();
}

 async function save() {
   try {
     localStorage.setItem(STORAGE_KEY, JSON.stringify(gifts));
   } catch (e) {
     showToast("couldn't save — try again");
   }
 }

//wheel logic
// ---------- WHEEL DRAWING ----------
function polar(cx, cy, r, angleDeg) {
  const a = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function sliceArc(cx, cy, r, start, end) {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = (end - start) > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

function buildWheel() {
  if (!wheelSvg) return;
  const available = gifts.filter(g => !g.claimedBy);
  currentSegments = available.map(g => ({ type: 'gift', gift: g }));
  currentSegments.push({ type: 'wild' });

  const n = currentSegments.length;
  const seg = 360 / n;
  const cx = 200, cy = 200, r = 196;
  const colors = ['#1c1616', '#2a1f1f', '#3d2b2b', '#120d0d'];
  const textColors = ['#e3ded5', '#e3ded5', '#e3ded5', '#e3ded5'];

  let svg = `<defs>
    <pattern id="mgStripe" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#1c1616"/>
      <rect width="5" height="10" fill="#c81d25"/>
    </pattern>
  </defs>`;

  currentSegments.forEach((s, i) => {
    const start = i * seg;
    const end = start + seg;
    const mid = start + seg / 2;
    let fill, textFill, label, sub;

    if (s.type === 'wild') {
      fill = 'url(#mgStripe)';
      textFill = '#e3ded5';
      label = '🃏';
      sub = 'WILD';
    } else {
      fill = colors[i % colors.length];
      textFill = textColors[i % textColors.length];
      label = s.gift.emoji || emojiFor(s.gift.name);
      sub = truncate(s.gift.name, 16);
    }

    svg += `<path d="${sliceArc(cx, cy, r, start, end)}" fill="${fill}" stroke="rgba(201, 162, 39, 0.4)" stroke-width="2"/>`;

    const labelPos = polar(cx, cy, r * 0.68, mid);
    const emojiPos = polar(cx, cy, r * 0.42, mid);
    
    svg += `<g transform="translate(${emojiPos.x},${emojiPos.y}) rotate(${mid})">
      <text text-anchor="middle" font-size="20" dy="6">${label}</text>
    </g>`;
    svg += `<g transform="translate(${labelPos.x},${labelPos.y}) rotate(${mid})">
      <text text-anchor="middle" font-size="11" font-family="Poppins, sans-serif" font-weight="600" fill="${textFill}" dy="4">${sub}</text>
    </g>`;
  });

  wheelSvg.innerHTML = svg;
  const hasGifts = available.length > 0;
  if (spinBtn) spinBtn.disabled = !hasGifts;
  if (emptyNote) emptyNote.style.display = hasGifts ? 'none' : 'block';

  updateWebsiteLedger();
}

// ---------- SPIN LOGIC ----------
if (spinBtn) {
  spinBtn.onclick = () => {
    if (spinning) return;
    if (!guestName) { if (gate) gate.style.display = 'flex'; return; }
    if (!currentSegments.length) return;

    spinning = true;
    spinBtn.disabled = true;

    const n = currentSegments.length;
    const seg = 360 / n;
    const idx = Math.floor(Math.random() * n);
    const jitter = (Math.random() - 0.5) * (seg * 0.5);
    const centerAngle = idx * seg + seg / 2 + jitter;
    const targetMod = ((360 - centerAngle) % 360 + 360) % 360;
    const currentMod = ((accumulatedRotation % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    const spins = 5 + Math.floor(Math.random() * 3);
    accumulatedRotation += delta + spins * 360;
    
    if (wheelGroup) wheelGroup.style.transform = `rotate(${accumulatedRotation}deg)`;

    const onDone = () => {
      wheelGroup.removeEventListener('transitionend', onDone);
      spinning = false;
      showResult(currentSegments[idx]);
    };
    if (wheelGroup) wheelGroup.addEventListener('transitionend', onDone);
  };
}

//winning and admin
// ---------- RESULT MODAL ----------
function showResult(segment) {
  const overlay = document.createElement('div');
  overlay.className = 'mg-overlay';

  if (segment.type === 'wild') {
    const available = gifts.filter(g => !g.claimedBy);
    overlay.innerHTML = `
      <div class="mg-modal">
        <div class="mg-modal-eyebrow">✦ THE JOKER ✦</div>
        <div class="mg-modal-emoji">🃏</div>
        <div class="mg-modal-title">Wild card! Pick anything</div>
        <div class="mg-modal-note">You get to choose whatever you like from the whole table.</div>
        <div class="mg-wild-list" id="mgWildList"></div>
        <div class="mg-modal-actions">
          <button class="mg-btn mg-btn-again" id="mgSpinAgainWild">Spin again instead</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const list = overlay.querySelector('#mgWildList');
    if (!available.length) {
      list.innerHTML = '<div style="font-size:12.5px;color:#8a8078;">nothing left to pick — everything is already claimed!</div>';
    }
    available.forEach(g => {
      const row = document.createElement('div');
      row.className = 'mg-wild-item';
      row.innerHTML = `<span>${g.emoji || emojiFor(g.name)} ${g.name}</span><span class="mg-wp">${g.price || ''}</span>`;
      row.onclick = async () => {
        g.claimedBy = guestName;
        await save();
        
        if (typeof saveNewGiftClaim === 'function') {
          saveNewGiftClaim(guestName, g.name);
        }

        buildWheel();
        overlay.remove();
        showToast('claimed "' + g.name + '" — keep it a secret 🤫');
      };
      list.appendChild(row);
    });
    overlay.querySelector('#mgSpinAgainWild').onclick = () => {
      overlay.remove();
      if (spinBtn) spinBtn.disabled = false;
    };
  } else {
    const g = segment.gift;
    overlay.innerHTML = `
      <div class="mg-modal">
        <div class="mg-modal-eyebrow">✦ THE WHEEL HAS SPOKEN ✦</div>
        <div class="mg-modal-emoji">${g.emoji || emojiFor(g.name)}</div>
        <div class="mg-modal-title">${g.name}</div>
        ${g.note ? `<div class="mg-modal-note">${g.note}</div>` : ''}
        <div class="mg-modal-meta">${g.price || ''} ${g.link ? `&nbsp;·&nbsp;<a href="${g.link}" target="_blank" rel="noopener noreferrer">view ↗</a>` : ''}</div>
        <div class="mg-modal-actions">
          <button class="mg-btn mg-btn-again" id="mgSpinAgain">🔄 Spin again</button>
          <button class="mg-btn mg-btn-buy" id="mgBuyBtn">🎁 I'll buy this</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#mgSpinAgain').onclick = () => {
      overlay.remove();
      if (spinBtn) spinBtn.disabled = false;
    };
    overlay.querySelector('#mgBuyBtn').onclick = async () => {
      g.claimedBy = guestName;
      await save();
      
      if (typeof saveNewGiftClaim === 'function') {
        saveNewGiftClaim(guestName, g.name);
      }

      buildWheel();updateWebsiteLedger();
      overlay.remove();
      showToast('claimed "' + g.name + '" — keep it a secret 🤫');
    };
  }
}

// ---------- MANAGE PANEL ----------
if (manageBtn) {
  manageBtn.onclick = () => {
    const overlay = document.createElement('div');
    overlay.className = 'mg-overlay';
    overlay.innerHTML = `
      <div class="mg-modal mg-manage-modal">
        <button class="mg-close-x" id="mgManageClose">✕</button>
        <div class="mg-modal-title">🂡 Manage the table</div>
        <div class="mg-add-form">
          <div><label>Item name</label><input id="mgFName" placeholder="e.g. Stray Kids photocard set" /></div>
          <div><label>Note (optional)</label><textarea id="mgFNote" placeholder="size, color, version..."></textarea></div>
          <div style="display:flex; gap:10px;">
            <div style="flex:1;"><label>Price</label><input id="mgFPrice" placeholder="e.g. RM 80" /></div>
            <div style="flex:1;"><label>Link</label><input id="mgFLink" placeholder="https://..." /></div>
          </div>
          <button class="mg-btn mg-btn-buy" id="mgFSave" style="margin-top:4px;">+ Add to table</button>
        </div>
        <div class="mg-list-existing" id="mgListExisting"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#mgManageClose').onclick = () => overlay.remove();

    function renderInline() {
      const wrap = overlay.querySelector('#mgListExisting');
      if (!wrap) return;
      wrap.innerHTML = '';
      if (!gifts.length) {
        wrap.innerHTML = '<div style="font-size:12px;color:#8a8078;padding:10px 0;">no cards added yet</div>';
        return;
      }
      gifts.forEach(g => {
        const row = document.createElement('div');
        row.className = 'mg-list-row';
        row.innerHTML = `<span>${g.emoji || emojiFor(g.name)} ${g.name} ${g.claimedBy ? `<span class="mg-claimed-tag">· claimed by ${g.claimedBy}</span>` : ''}</span>`;
        const del = document.createElement('button');
        del.className = 'mg-row-del';
        del.textContent = '✕';
        del.onclick = async () => {
          gifts = gifts.filter(x => x.id !== g.id);
          await save();
          buildWheel();
          renderInline();
        };
        row.appendChild(del);
        wrap.appendChild(row);
      });
    }
    renderInline();

    overlay.querySelector('#mgFSave').onclick = async () => {
      const name = overlay.querySelector('#mgFName').value.trim();
      if (!name) { showToast('give it a name first'); return; }
      const note = overlay.querySelector('#mgFNote').value.trim();
      const price = overlay.querySelector('#mgFPrice').value.trim();
      const link = overlay.querySelector('#mgFLink').value.trim();
      gifts.unshift({
        id: 'g' + Date.now() + Math.random().toString(36).slice(2, 7),
        name, note, price, link, claimedBy: null, emoji: emojiFor(name)
      });
      await save();
      buildWheel();
      renderInline();
      overlay.querySelector('#mgFName').value = '';
      overlay.querySelector('#mgFNote').value = '';
      overlay.querySelector('#mgFPrice').value = '';
      overlay.querySelector('#mgFLink').value = '';
      showToast('added to the table ✨');
    };
  };
}

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', () => {
    load(); 
    if (typeof updateClaimsTable === 'function') {
        updateClaimsTable();
        setInterval(updateClaimsTable, 15000);
    }
});

// ---------- LIVE WEBSITE LEDGER DRAWING ----------
function updateWebsiteLedger() {
  const table = document.getElementById('mgLedgerTable');
  const rowsContainer = document.getElementById('mgLedgerRows');
  const emptyNote = document.getElementById('mgLedgerEmpty');
  
  if (!rowsContainer || !table || !emptyNote) return;
  
  // Filter down to show only items that have an owner signature
  const claimedItems = gifts.filter(g => g.claimedBy);
  
  if (claimedItems.length === 0) {
    table.style.display = 'none';
    emptyNote.style.display = 'block';
    return;
  }
  
  // Build rows dynamically
  emptyNote.style.display = 'none';
  table.style.display = 'table';
  rowsContainer.innerHTML = '';
  
  claimedItems.forEach(item => {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
    row.innerHTML = `
      <td style="padding:12px 5px; color:#e3ded5; font-weight:500;">
        ${item.emoji || emojiFor(item.name)} ${item.name}
      </td>
      <td style="padding:12px 5px; color:#c9a227; text-align:right; font-weight:600; letter-spacing:0.5px;">
        🔒 ${item.claimedBy.toUpperCase()}
      </td>
    `;
    rowsContainer.appendChild(row);
  });
}


})();
