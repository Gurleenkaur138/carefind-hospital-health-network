// CareFind Vanilla JavaScript Application Logic

document.addEventListener('DOMContentLoaded', () => {
  // State Management
  let activeTab = 'home';
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('carefind_user') || 'null');
  } catch (e) {
    user = null;
  }

  let appointments = [];
  try {
    appointments = JSON.parse(localStorage.getItem('carefind_appointments') || '[]');
    if (!Array.isArray(appointments)) appointments = [];
  } catch (e) {
    appointments = [];
  }

  let selectedDoctorForBooking = null;
  let currentErFilter = 'all';

  // DOM Elements
  const navItems = document.querySelectorAll('.nav-item');
  const tabViews = document.querySelectorAll('.tab-view');
  const mobileToggle = document.getElementById('mobile-toggle');
  const navbarMenu = document.getElementById('navbar-menu');
  const btnEr = document.getElementById('btn-er');

  // Modals
  const bookingModal = document.getElementById('booking-modal');
  const loginModal = document.getElementById('login-modal');

  // Initialize Application
  initApp();

  function initApp() {
    setupEventListeners();
    renderHospitals();
    renderDoctors();
    renderErLocator();
    populateFilters();
    renderCompare();
    renderDetailsView();
    updateUserUI();
  }

  // Navigation & Tab Switching
  function switchTab(tabId) {
    activeTab = tabId;
    const allNavs = document.querySelectorAll('.nav-item');
    const allViews = document.querySelectorAll('.tab-view');

    allNavs.forEach(item => {
      if (item.dataset.tab === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    allViews.forEach(view => {
      if (view.id === `tab-${tabId}`) {
        view.classList.add('active');
      } else {
        view.classList.remove('active');
      }
    });

    if (tabId === 'portal') renderPortalView();
    if (tabId === 'compare') renderCompare();
    if (tabId === 'details') renderDetailsView();

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (navbarMenu && navbarMenu.classList.contains('open')) {
      navbarMenu.classList.remove('open');
    }
  }

  function setupEventListeners() {
    // Global Event Delegation for Navigation Tabs
    document.addEventListener('click', (e) => {
      const navBtn = e.target.closest('.nav-item');
      if (navBtn && navBtn.dataset.tab) {
        switchTab(navBtn.dataset.tab);
      }
    });

    // Mobile menu toggle
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('open');
      });
    }

    // Emergency ER locator buttons
    if (btnEr) {
      btnEr.addEventListener('click', () => switchTab('er'));
    }

    // Brand logo click to return home
    document.getElementById('brand-logo')?.addEventListener('click', () => switchTab('home'));

    // View all hospitals button on home page
    document.querySelectorAll('.view-all-hospitals-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab('hospitals'));
    });

    // Hero Quick Search
    const heroSearchBtn = document.getElementById('hero-search-btn');
    const heroKeywordInput = document.getElementById('hero-keyword');
    if (heroSearchBtn && heroKeywordInput) {
      const handleHeroSearch = () => {
        const query = heroKeywordInput.value.trim();
        const searchInput = document.getElementById('search-keyword');
        if (searchInput) searchInput.value = query;
        switchTab('search');
        filterCareProviders();
      };
      heroSearchBtn.addEventListener('click', handleHeroSearch);
      heroKeywordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleHeroSearch();
      });
    }

    // Filter controls
    document.getElementById('search-keyword')?.addEventListener('input', filterCareProviders);
    document.getElementById('filter-specialty')?.addEventListener('change', filterCareProviders);
    document.getElementById('filter-city')?.addEventListener('change', filterCareProviders);
    document.getElementById('filter-insurance')?.addEventListener('change', filterCareProviders);

    // Online consultation form
    document.getElementById('consult-form')?.addEventListener('submit', handleConsultSubmit);

    // Booking modal form submit
    document.getElementById('booking-form')?.addEventListener('submit', handleBookingSubmit);

    // Login form submit
    document.getElementById('login-form')?.addEventListener('submit', handleLoginSubmit);

    // Compare selectors
    document.getElementById('compare-item-1')?.addEventListener('change', updateCompareView);
    document.getElementById('compare-item-2')?.addEventListener('change', updateCompareView);

    // ER Locator filters
    document.querySelectorAll('.er-filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.er-filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentErFilter = e.target.dataset.erFilter;
        renderErLocator();
      });
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        bookingModal.classList.remove('active');
        loginModal.classList.remove('active');
      });
    });
  }

  // Populate Filter Select Options
  function populateFilters() {
    const specSelect = document.getElementById('filter-specialty');
    const citySelect = document.getElementById('filter-city');
    const insSelect = document.getElementById('filter-insurance');

    if (specSelect) {
      specSelect.innerHTML = `<option value="All">All Medical Specialties</option>` +
        CARE_DATA.specialties.map(s => `<option value="${s}">${s}</option>`).join('');
    }
    if (citySelect) {
      citySelect.innerHTML = CARE_DATA.cities.map(c => `<option value="${c}">${c === 'All' ? 'All Cities' : c}</option>`).join('');
    }
    if (insSelect) {
      insSelect.innerHTML = CARE_DATA.insurances.map(i => `<option value="${i}">${i === 'All' ? 'All Insurance Plans' : i}</option>`).join('');
    }
  }

  // Render Hospitals (Home & Directory)
  function renderHospitals() {
    const homeContainer = document.getElementById('home-hospitals');
    const dirContainer = document.getElementById('hospitals-grid');

    const hospitalCardsHTML = CARE_DATA.hospitals.map(h => `
      <div class="card">
        <img src="${h.image}" alt="${h.name}" class="card-image" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=600&auto=format&fit=crop&q=80';" />
        <div class="card-body">
          <div>
            <div class="card-header">
              <h3 class="card-title">${h.name}</h3>
              <span class="badge-rating">⭐ ${h.rating}</span>
            </div>
            <p class="card-meta">📍 ${h.address}</p>
            <p class="card-desc">📞 ${h.phone} • 🚨 Emergency Hotline: ${h.emergency_hotline}</p>
            <div style="display:flex; gap:0.5rem; margin-bottom:1rem; flex-wrap:wrap;">
              <span style="font-size:0.75rem; font-weight:700; background:#e0f2fe; color:#0369a1; padding:0.25rem 0.5rem; border-radius:6px;">ER Beds: ${h.available_er_beds}</span>
              <span style="font-size:0.75rem; font-weight:700; background:#ccfbf1; color:#0f766e; padding:0.25rem 0.5rem; border-radius:6px;">ICU Beds: ${h.available_icu_beds}</span>
              <span style="font-size:0.75rem; font-weight:700; background:#fef3c7; color:#b45309; padding:0.25rem 0.5rem; border-radius:6px;">${h.trauma_level}</span>
            </div>
          </div>
          <button class="btn-primary view-hospital-btn" data-id="${h.id}">View Hospital Details</button>
        </div>
      </div>
    `).join('');

    if (homeContainer) homeContainer.innerHTML = hospitalCardsHTML;
    if (dirContainer) dirContainer.innerHTML = hospitalCardsHTML;

    document.querySelectorAll('.view-hospital-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        inspectHospitalDetails(e.target.dataset.id);
      });
    });
  }

  // Render Doctors (Search & Directory)
  function renderDoctors(doctorsToRender = CARE_DATA.doctors) {
    const searchContainer = document.getElementById('doctors-grid');
    const dirContainer = document.getElementById('doctors-dir-grid');

    if (!searchContainer) return;

    if (doctorsToRender.length === 0) {
      const emptyHTML = `<div style="grid-column: 1/-1; text-align:center; padding:3rem; background:white; border-radius:16px; border:1px solid #cee3db;">
        <h3 style="font-size:1.2rem; font-weight:800;">No Doctors Match Your Filter Criteria</h3>
        <p style="color:#64748b; font-size:0.85rem; margin-top:0.5rem;">Try clearing your search term or selecting a different specialty/city.</p>
      </div>`;
      searchContainer.innerHTML = emptyHTML;
      if (dirContainer) dirContainer.innerHTML = emptyHTML;
      return;
    }

    const cardsHTML = doctorsToRender.map(d => `
      <div class="card">
        <img src="${d.photo}" alt="${d.name}" class="card-image" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80';" />
        <div class="card-body">
          <div>
            <div class="card-header">
              <div>
                <h3 class="card-title">${d.name}</h3>
                <span style="font-size:0.75rem; font-weight:700; color:#0d9488;">${d.specialty}</span>
              </div>
              <span class="badge-rating">⭐ ${d.rating}</span>
            </div>
            <p class="card-meta">🏥 ${d.hospital_name} (${d.city})</p>
            <p class="card-desc">${d.bio}</p>
            <p style="font-weight:800; font-size:0.9rem; color:#0f172a; margin-bottom:1rem;">Consultation Fee: ₹${d.fee}</p>
          </div>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn-outline inspect-doctor-btn" data-id="${d.id}" style="flex:1;">Details</button>
            <button class="btn-teal book-doctor-btn" data-id="${d.id}" style="flex:1;">Book Visit</button>
          </div>
        </div>
      </div>
    `).join('');

    searchContainer.innerHTML = cardsHTML;
    if (dirContainer) dirContainer.innerHTML = cardsHTML;

    document.querySelectorAll('.book-doctor-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        openBookingModal(e.target.dataset.id);
      });
    });

    document.querySelectorAll('.inspect-doctor-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        inspectDoctorDetails(e.target.dataset.id);
      });
    });
  }

  // Filter Care Providers
  function filterCareProviders() {
    const keyword = document.getElementById('search-keyword')?.value.toLowerCase() || '';
    const spec = document.getElementById('filter-specialty')?.value || 'All';
    const city = document.getElementById('filter-city')?.value || 'All';
    const ins = document.getElementById('filter-insurance')?.value || 'All';

    const filtered = CARE_DATA.doctors.filter(d => {
      const matchKeyword = d.name.toLowerCase().includes(keyword) ||
                           d.specialty.toLowerCase().includes(keyword) ||
                           d.hospital_name.toLowerCase().includes(keyword);
      const matchSpec = spec === 'All' || d.specialty === spec;
      const matchCity = city === 'All' || d.city === city || (d.state && city.toLowerCase().includes(d.state.toLowerCase())) || city.toLowerCase().includes(d.city.toLowerCase());
      const matchIns = ins === 'All' || d.accepted_insurances.includes(ins);

      return matchKeyword && matchSpec && matchCity && matchIns;
    });

    renderDoctors(filtered);
  }

  // 24/7 ER Locator Render
  function renderErLocator() {
    const container = document.getElementById('er-locator-grid');
    if (!container) return;

    let erHospitals = CARE_DATA.hospitals;

    if (currentErFilter === 'fastest') {
      erHospitals = erHospitals.filter(h => h.available_er_beds >= 10);
    } else if (currentErFilter === 'level1') {
      erHospitals = erHospitals.filter(h => h.trauma_level.includes('Level 1'));
    }

    container.innerHTML = erHospitals.map(h => `
      <div class="card" style="border: 2px solid #fca5a5;">
        <div style="background:#fee2e2; padding:0.75rem 1rem; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:0.75rem; font-weight:800; color:#dc2626;">🚨 24/7 EMERGENCY READY</span>
          <span style="font-size:0.75rem; font-weight:800; background:#dc2626; color:white; padding:0.15rem 0.5rem; border-radius:4px;">${h.trauma_level}</span>
        </div>
        <img src="${h.image}" alt="${h.name}" class="card-image" />
        <div class="card-body">
          <div>
            <h3 class="card-title">${h.name}</h3>
            <p class="card-meta">📍 ${h.address}</p>

            <div style="background:#f8fafc; padding:0.85rem; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:1rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:800; color:#0f172a; margin-bottom:0.25rem;">
                <span>Live ER Wait Time:</span>
                <span style="color:#166534;">⚡ ${Math.floor(8 + (h.id * 3))} Mins</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#475569;">
                <span>Available ER Beds:</span>
                <span style="font-weight:800; color:#0284c7;">${h.available_er_beds} Beds</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#475569;">
                <span>ICU Beds Available:</span>
                <span style="font-weight:800; color:#0f766e;">${h.available_icu_beds} Beds</span>
              </div>
            </div>
          </div>

          <div style="display:flex; gap:0.5rem;">
            <a href="tel:${h.emergency_hotline}" class="btn-er" style="flex:1; text-align:center; text-decoration:none;">📞 Call Hotline</a>
            <button class="btn-outline get-directions-btn" data-name="${h.name}" style="flex:1;">📍 Directions</button>
          </div>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.get-directions-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const hospitalName = e.target.dataset.name;
        alert(`🗺️ Directions Request:\n\nSimulating GPS turn-by-turn route to ${hospitalName}.\nDistance: 2.4 miles (Approx 6 minutes driving time).`);
      });
    });
  }

  // Compare Feature
  function renderCompare() {
    const select1 = document.getElementById('compare-item-1');
    const select2 = document.getElementById('compare-item-2');
    if (!select1 || !select2) return;

    const options = CARE_DATA.doctors.map(d => `<option value="${d.id}">${d.name} (${d.specialty})</option>`).join('');
    select1.innerHTML = options;
    select2.innerHTML = options;
    if (CARE_DATA.doctors.length > 1) select2.selectedIndex = 1;

    updateCompareView();
  }

  function updateCompareView() {
    const id1 = Number(document.getElementById('compare-item-1')?.value || 1);
    const id2 = Number(document.getElementById('compare-item-2')?.value || 2);

    const doc1 = CARE_DATA.doctors.find(d => d.id === id1);
    const doc2 = CARE_DATA.doctors.find(d => d.id === id2);

    const head1 = document.getElementById('compare-head-1');
    const head2 = document.getElementById('compare-head-2');
    const container = document.getElementById('compare-table-body');

    if (!container || !doc1 || !doc2) return;

    if (head1) head1.textContent = doc1.name;
    if (head2) head2.textContent = doc2.name;

    container.innerHTML = `
      <tr>
        <td><strong>Specialist Name</strong></td>
        <td><strong>${doc1.name}</strong></td>
        <td><strong>${doc2.name}</strong></td>
      </tr>
      <tr>
        <td><strong>Specialty & Title</strong></td>
        <td>${doc1.title} (${doc1.specialty})</td>
        <td>${doc2.title} (${doc2.specialty})</td>
      </tr>
      <tr>
        <td><strong>Hospital Affiliation</strong></td>
        <td>${doc1.hospital_name} (${doc1.city})</td>
        <td>${doc2.hospital_name} (${doc2.city})</td>
      </tr>
      <tr>
        <td><strong>Consultation Fee</strong></td>
        <td style="font-weight:800; color:#15803d;">$${doc1.fee}</td>
        <td style="font-weight:800; color:#15803d;">$${doc2.fee}</td>
      </tr>
      <tr>
        <td><strong>Clinical Experience</strong></td>
        <td>${doc1.experience} Years</td>
        <td>${doc2.experience} Years</td>
      </tr>
      <tr>
        <td><strong>Patient Rating</strong></td>
        <td>⭐ ${doc1.rating} / 5.0 (${doc1.reviews_count} reviews)</td>
        <td>⭐ ${doc2.rating} / 5.0 (${doc2.reviews_count} reviews)</td>
      </tr>
      <tr>
        <td><strong>Telehealth Online Visit</strong></td>
        <td>${doc1.telehealth ? '✅ Available' : '❌ In-Person Only'}</td>
        <td>${doc2.telehealth ? '✅ Available' : '❌ In-Person Only'}</td>
      </tr>
      <tr>
        <td><strong>Accepted Insurance</strong></td>
        <td>${doc1.accepted_insurances.join(', ')}</td>
        <td>${doc2.accepted_insurances.join(', ')}</td>
      </tr>
    `;
  }

  // Inspect Details View
  function inspectHospitalDetails(hospitalId) {
    const hospital = CARE_DATA.hospitals.find(h => h.id === Number(hospitalId)) || CARE_DATA.hospitals[0];
    if (!hospital) return;

    const detailsContainer = document.getElementById('details-content');
    if (!detailsContainer) return;

    // Match affiliated doctors by hospital name or city
    const hDoctors = CARE_DATA.doctors.filter(d => 
      (d.hospital_name && d.hospital_name.toLowerCase().includes(hospital.name.toLowerCase().split(' ')[0])) ||
      (d.city && hospital.city && d.city.toLowerCase() === hospital.city.toLowerCase())
    );

    detailsContainer.innerHTML = `
      <div style="background:white; border-radius:24px; padding:2rem; border:1px solid #cee3db; box-shadow:0 4px 12px -2px rgba(10,35,28,0.1);">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
          <div>
            <span style="background:#e0f2fe; color:#0369a1; font-size:0.75rem; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px;">NABH & JCI ACCREDITED FACILITY</span>
            <h2 style="font-size:1.85rem; font-weight:900; margin-top:0.35rem; color:#0f172a;">${hospital.name}</h2>
            <p style="font-size:0.85rem; color:#64748b;">📍 ${hospital.address}, ${hospital.city}, ${hospital.state || 'India'}</p>
            <p style="font-size:0.85rem; color:#dc2626; font-weight:700; margin-top:0.25rem;">🚨 24/7 Hotline: ${hospital.emergency_hotline} • 📞 ${hospital.phone}</p>
          </div>
          <div style="background:#fef3c7; border:1px solid #fde68a; padding:0.85rem 1.25rem; border-radius:16px; text-align:center;">
            <span style="font-size:1.25rem; font-weight:900; color:#b45309;">⭐ ${hospital.rating} / 5.0</span>
            <span style="display:block; font-size:0.7rem; color:#78350f; font-weight:700;">${hospital.reviews_count} Patient Reviews</span>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:1rem; margin-bottom:1.75rem;">
          <div style="background:#f8fafc; padding:1rem; border-radius:16px; text-align:center; border:1px solid #e2e8f0;">
            <span style="font-size:0.7rem; color:#64748b; font-weight:700; display:block;">ER BEDS AVAILABLE</span>
            <span style="font-size:1.35rem; font-weight:900; color:#dc2626;">${hospital.available_er_beds} Beds</span>
          </div>
          <div style="background:#f8fafc; padding:1rem; border-radius:16px; text-align:center; border:1px solid #e2e8f0;">
            <span style="font-size:0.7rem; color:#64748b; font-weight:700; display:block;">ICU BEDS AVAILABLE</span>
            <span style="font-size:1.35rem; font-weight:900; color:#0284c7;">${hospital.available_icu_beds} Beds</span>
          </div>
          <div style="background:#f8fafc; padding:1rem; border-radius:16px; text-align:center; border:1px solid #e2e8f0;">
            <span style="font-size:0.7rem; color:#64748b; font-weight:700; display:block;">TRAUMA LEVEL</span>
            <span style="font-size:0.85rem; font-weight:800; color:#0f172a;">${hospital.trauma_level}</span>
          </div>
          <div style="background:#f8fafc; padding:1rem; border-radius:16px; text-align:center; border:1px solid #e2e8f0;">
            <span style="font-size:0.7rem; color:#64748b; font-weight:700; display:block;">BLOOD BANK</span>
            <span style="font-size:0.85rem; font-weight:800; color:#166534;">✅ In Stock (All Groups)</span>
          </div>
        </div>

        <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:0.75rem; color:#0f172a;">Hospital Departments & Medical Centers</h3>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.75rem;">
          ${(hospital.departments || ["Cardiology", "Neurology", "Orthopedics", "Emergency Care", "Pediatrics", "Gynecology"]).map(dept => `
            <span style="background:#f1f5f9; color:#334155; padding:0.4rem 0.85rem; border-radius:10px; font-size:0.8rem; font-weight:700;">🏥 ${dept}</span>
          `).join('')}
        </div>

        <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:0.75rem; color:#0f172a;">Affiliated Senior Specialists (${hDoctors.length})</h3>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:1.25rem;">
          ${hDoctors.map(d => `
            <div style="padding:1.25rem; background:#f8fafc; border-radius:18px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; gap:0.75rem;">
              <div style="display:flex; align-items:center; gap:0.85rem;">
                <img src="${d.photo}" alt="${d.name}" style="width:60px; height:60px; border-radius:14px; object-fit:cover;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80';" />
                <div>
                  <h4 style="font-size:0.95rem; font-weight:800; color:#0f172a;">${d.name}</h4>
                  <p style="font-size:0.75rem; color:#0d9488; font-weight:700;">${d.specialty}</p>
                  <p style="font-size:0.75rem; color:#64748b;">Fee: ₹${d.fee} • ⭐ ${d.rating}</p>
                </div>
              </div>
              <button class="btn-teal book-doctor-btn" data-id="${d.id}" style="padding:0.5rem 0.85rem; font-size:0.78rem;">Book Visit</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.querySelectorAll('.book-doctor-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        openBookingModal(e.target.dataset.id);
      });
    });
  }

  function inspectDoctorDetails(doctorId) {
    switchTab('details');
    const doctor = CARE_DATA.doctors.find(d => d.id === Number(doctorId));
    if (!doctor) return;

    const detailsContainer = document.getElementById('details-content');
    if (!detailsContainer) return;

    detailsContainer.innerHTML = `
      <div style="background:white; border-radius:24px; padding:2rem; border:1px solid #cee3db; box-shadow:0 4px 12px -2px rgba(10,35,28,0.1);">
        <div style="display:flex; align-items:flex-start; gap:1.5rem; flex-wrap:wrap; margin-bottom:1.5rem;">
          <img src="${doctor.photo}" alt="${doctor.name}" style="width:120px; height:120px; border-radius:20px; object-fit:cover;" />
          <div style="flex:1; min-width:240px;">
            <span style="background:#ccfbf1; color:#0f766e; font-size:0.75rem; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px;">${doctor.title}</span>
            <h2 style="font-size:1.85rem; font-weight:900; margin-top:0.35rem;">${doctor.name}</h2>
            <p style="font-size:0.85rem; font-weight:700; color:#0d9488;">${doctor.specialty} Specialist</p>
            <p style="font-size:0.8rem; color:#64748b;">🏥 ${doctor.hospital_name} (${doctor.city})</p>
          </div>
          <div style="background:#f8fafc; padding:1.25rem; border-radius:16px; border:1px solid #e2e8f0; text-align:center; min-width:180px;">
            <span style="font-size:0.75rem; color:#64748b; font-weight:700;">CONSULTATION FEE</span>
            <span style="display:block; font-size:1.75rem; font-weight:900; color:#0f172a; margin:0.25rem 0;">$${doctor.fee}</span>
            <button class="btn-teal book-now-direct" data-id="${doctor.id}" style="width:100%;">Book Visit</button>
          </div>
        </div>

        <h3 style="font-size:1rem; font-weight:800; margin-bottom:0.5rem;">Clinical Biography</h3>
        <p style="font-size:0.85rem; color:#475569; line-height:1.6; margin-bottom:1.5rem;">${doctor.bio}</p>

        <h3 style="font-size:1rem; font-weight:800; margin-bottom:0.5rem;">Accepted Insurance Coverage</h3>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-bottom:1.5rem;">
          ${doctor.accepted_insurances.map(i => `<span style="background:#f1f5f9; padding:0.35rem 0.75rem; border-radius:8px; font-size:0.75rem; font-weight:700; color:#334155;">${i}</span>`).join('')}
        </div>

        <h3 style="font-size:1rem; font-weight:800; margin-bottom:0.5rem;">Patient Reviews</h3>
        <div>
          ${doctor.reviews.map(r => `
            <div style="background:#f8fafc; padding:1rem; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:0.75rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; color:#0f172a;">
                <span>${r.reviewer}</span>
                <span style="color:#f59e0b;">⭐ ${r.rating} / 5.0</span>
              </div>
              <p style="font-size:0.8rem; color:#475569; margin-top:0.25rem; font-style:italic;">"${r.text}"</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.querySelector('.book-now-direct')?.addEventListener('click', (e) => {
      openBookingModal(e.target.dataset.id);
    });
  }

  function renderPortalView() {
    renderPatientPortal();
  }

  function renderDetailsView() {
    inspectHospitalDetails(1);
  }

  // Booking Modal Logic
  function openBookingModal(doctorId) {
    selectedDoctorForBooking = CARE_DATA.doctors.find(d => d.id === Number(doctorId));
    if (!selectedDoctorForBooking) return;

    document.getElementById('modal-doctor-name').textContent = selectedDoctorForBooking.name;
    document.getElementById('modal-doctor-meta').textContent = `${selectedDoctorForBooking.specialty} • ${selectedDoctorForBooking.hospital_name}`;

    const slotSelect = document.getElementById('booking-slot');
    if (slotSelect) {
      slotSelect.innerHTML = selectedDoctorForBooking.slots.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    bookingModal.classList.add('active');
  }

  function handleBookingSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('patient-name').value.trim();
    const phone = document.getElementById('patient-phone').value.trim();
    const date = document.getElementById('booking-date').value;
    const slot = document.getElementById('booking-slot').value;

    if (!name || !phone || !date || !slot) {
      alert("Please fill in all required booking details.");
      return;
    }

    const newAppt = {
      id: 'CF-' + Math.floor(100000 + Math.random() * 900000),
      doctor_name: selectedDoctorForBooking.name,
      specialty: selectedDoctorForBooking.specialty,
      hospital: selectedDoctorForBooking.hospital_name,
      patient_name: name,
      phone: phone,
      date: date,
      time: slot,
      created_at: new Date().toLocaleDateString()
    };

    appointments.push(newAppt);
    localStorage.setItem('carefind_appointments', JSON.stringify(appointments));

    // Close booking input modal
    bookingModal.classList.remove('active');
    document.getElementById('booking-form').reset();

    // Populate success confirmation modal
    const successModal = document.getElementById('success-modal');
    const detailsContainer = document.getElementById('success-modal-details');

    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:0.5rem;">
          <span style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase;">Booking Reference</span>
          <span style="font-weight:900; color:#0f172a; background:#e0f2fe; color:#0369a1; padding:0.15rem 0.5rem; border-radius:6px;">${newAppt.id}</span>
        </div>
        <div>
          <strong style="color:#0f172a;">Doctor:</strong> ${newAppt.doctor_name} (${newAppt.specialty})
        </div>
        <div>
          <strong style="color:#0f172a;">Hospital:</strong> ${newAppt.hospital}
        </div>
        <div>
          <strong style="color:#0f172a;">Patient:</strong> ${newAppt.patient_name} (${newAppt.phone})
        </div>
        <div>
          <strong style="color:#0f172a;">Date & Time:</strong> 📅 ${newAppt.date} at ⏰ ${newAppt.time}
        </div>
      `;
    }

    if (successModal) {
      successModal.classList.add('active');
    }

    if (!user) {
      user = { email: 'patient@carefind.org', name: name.toUpperCase() };
      localStorage.setItem('carefind_user', JSON.stringify(user));
      updateUserUI();
    }

    const btnGoPortal = document.getElementById('btn-go-portal');
    if (btnGoPortal) {
      btnGoPortal.onclick = () => {
        successModal.classList.remove('active');
        switchTab('portal');
      };
    }
  }

  // Online Consultation Submit
  function handleConsultSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('consult-name').value;
    const email = document.getElementById('consult-email').value;
    const spec = document.getElementById('consult-specialty').value;
    const roomId = 'CARE-ROOM-' + Math.floor(1000 + Math.random() * 9000);

    alert(`✅ Online Consultation Requested!\n\nPatient: ${name}\nSpecialty: ${spec}\nMeeting Room ID: ${roomId}\n\nA secure HD video join link has been sent to ${email}.`);
    document.getElementById('consult-form').reset();
  }

  // Login Modal & Patient Portal
  function openLoginModal() {
    loginModal.classList.add('active');
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const name = email.split('@')[0];

    user = { email, name: name.toUpperCase() };
    localStorage.setItem('carefind_user', JSON.stringify(user));

    loginModal.classList.remove('active');
    updateUserUI();
    switchTab('portal');
  }

  function updateUserUI() {
    const navPortal = document.getElementById('nav-portal');
    if (navPortal) {
      navPortal.innerHTML = user ? `👤 ${user.name}` : `Login/Profile`;
    }
    renderPatientPortal();
  }

  function renderPatientPortal() {
    const portalContainer = document.getElementById('portal-content');
    if (!portalContainer) return;

    if (!user) {
      portalContainer.innerHTML = `
        <div style="text-align:center; padding:3.5rem 2rem; background:white; border-radius:24px; border:1px solid #cee3db; max-width:550px; margin:0 auto;">
          <h2 style="font-size:1.5rem; font-weight:900;">Patient Authentication Required</h2>
          <p style="color:#64748b; margin:0.5rem 0 1.5rem 0; font-size:0.9rem;">Please log in to view your appointment history, digital health passes, and telehealth consultations.</p>
          <button class="btn-primary" id="portal-login-btn" style="padding:0.75rem 1.5rem;">Log In Now</button>
        </div>
      `;
      document.getElementById('portal-login-btn')?.addEventListener('click', openLoginModal);
      return;
    }

    portalContainer.innerHTML = `
      <div style="background:white; border-radius:24px; padding:2rem; border:1px solid #cee3db; box-shadow:0 4px 12px -2px rgba(10,35,28,0.1);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
          <div>
            <span style="background:#ccfbf1; color:#0f766e; font-size:0.75rem; font-weight:800; padding:0.25rem 0.65rem; border-radius:6px;">PATIENT PORTAL DASHBOARD</span>
            <h2 style="font-size:1.75rem; font-weight:900; margin-top:0.35rem;">Welcome, ${user.name}</h2>
            <p style="font-size:0.85rem; color:#64748b;">${user.email}</p>
          </div>
          <button class="btn-outline" id="btn-logout">Logout</button>
        </div>

        <h3 style="font-size:1.1rem; font-weight:800; margin-bottom:1rem;">Your Scheduled Appointments (${appointments.length})</h3>
        ${appointments.length === 0 ? `<p style="color:#64748b; font-style:italic;">No appointments booked yet. Use the "Find Healthcare" tab to search doctors and book visits.</p>` : `
          <div style="display:grid; gap:1rem;">
            ${appointments.map(a => `
              <div style="background:#f8fafc; padding:1.25rem; border-radius:16px; border:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
                <div>
                  <span style="font-size:0.75rem; font-weight:800; color:#0284c7;">HEALTH PASS CODE: ${a.id}</span>
                  <h4 style="font-size:1.05rem; font-weight:800;">${a.doctor_name} (${a.specialty})</h4>
                  <p style="font-size:0.8rem; color:#64748b;">🏥 ${a.hospital}</p>
                  <p style="font-size:0.8rem; font-weight:700; color:#0f172a; margin-top:0.25rem;">📅 Date: ${a.date} at ${a.time}</p>
                </div>
                <div style="display:flex; gap:0.5rem; align-items:center;">
                  <span style="background:#dcfce7; color:#166534; font-size:0.75rem; font-weight:800; padding:0.35rem 0.75rem; border-radius:999px;">CONFIRMED</span>
                  <button class="btn-outline cancel-appt-btn" data-id="${a.id}" style="padding:0.35rem 0.65rem; font-size:0.75rem; color:#dc2626; border-color:#fca5a5;">Cancel</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    document.getElementById('btn-logout')?.addEventListener('click', () => {
      user = null;
      localStorage.removeItem('carefind_user');
      updateUserUI();
      switchTab('home');
    });

    document.querySelectorAll('.cancel-appt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const apptId = e.target.dataset.id;
        if (confirm(`Are you sure you want to cancel appointment ${apptId}?`)) {
          appointments = appointments.filter(a => a.id !== apptId);
          localStorage.setItem('carefind_appointments', JSON.stringify(appointments));
          renderPatientPortal();
        }
      });
    });
  }

});
