/* ==========================================
   SDÜ Kültür ve Kitap Topluluğu - Admin Panel JS
   Roles: Super Admin (ilkerm946@gmail.com), Editor, Moderator, Member
   Zero-cost static sync with LocalStorage & SessionStorage
   ========================================== */

import { getMembers, deleteMember as fbDeleteMember, registerAdmin, loginAdmin, getAdmins, approveAdmin, deleteAdmin as fbDeleteAdmin, getApplications, updateApplicationStatus, deleteApplication as fbDeleteApplication, getSuggestions, updateSuggestionStatus, deleteSuggestion as fbDeleteSuggestion, getAutoAcceptSetting, setAutoAcceptSetting, getPublicData, setPublicData, verifyAdmin } from './firebase-service.js';

(function () {
    'use strict';

    // === VARSAYILAN VERİ YAPISI ===
    const DEFAULT_DATA = {
        book: {
            monthTag: "Ekim 2026 Seçkisi",
            title: "Kürk Mantolu Madonna",
            author: "Sabahattin Ali",
            genre: "Türk Klasikleri",
            pages: "160",
            readers: "0 Okur",
            synopsis: "Topluluğumuzla bu ay Türk edebiyatının derin aşk ve yabancılaşma başyapıtını tahlil ediyoruz. Yalnızlık, sanat ve ruh bağları üzerine konuşacağımız bu özel oturuma tüm üniversitemiz davetlidir.",
            quote: "İnsanlara inanmak, onlara güvenmek lazım geldiğini biliyorum... Fakat bir kere aldanan bir adamın bir daha inanmasına imkân var mıdır?",
            progress: 0,
            meetingDate: "Henüz belirlenmedi",
            meetingPlace: "Henüz belirlenmedi"
        },
        events: [
            {
                id: 5,
                title: "Yazma Etkinliği",
                category: "kitap",
                date: "05 Mart 2026",
                time: "14:00",
                place: "Etkinlik Salonu",
                badge: "Tamamlandı",
                icon: "fas fa-pencil-alt",
                desc: "Workshop formatında gerçekleştirilen yazma etkinliğimiz."
            },
            {
                id: 6,
                title: "Adem'den Önce Kitap Kritiği",
                category: "kitap",
                date: "10 Aralık 2025",
                time: "15:00",
                place: "Okuma Salonu",
                badge: "Tamamlandı",
                icon: "fas fa-book-open",
                desc: "Adem'den Önce kitabı üzerine gerçekleştirdiğimiz söyleşi."
            },
            {
                id: 7,
                title: "Matrix Film İzleme Etkinliği",
                category: "soylesi",
                date: "24 Ekim 2025",
                time: "19:00",
                place: "Sinema Salonu",
                badge: "Tamamlandı",
                icon: "fas fa-film",
                desc: "Üyelerimizle birlikte gerçekleştirdiğimiz film izleme ve tahlil etkinliği."
            },
            {
                id: 8,
                title: "Tanışma Toplantısı",
                category: "soylesi",
                date: "15 Ekim 2025",
                time: "17:00",
                place: "Merkez Kütüphane",
                badge: "Tamamlandı",
                icon: "fas fa-users",
                desc: "SDÜ Kültür ve Kitap Topluluğu tanışma toplantısı."
            }
        ],
        applications: [],
        suggestions: [],
        users: [
            {
                id: 1,
                name: "İlker M.",
                email: "ilkerm946@gmail.com",
                password: "ilker123",
                role: "superadmin",
                title: "Topluluk Başkanı (Süper Admin)",
                isMaster: true
            }
        ]
    };

    const STORAGE_KEY = 'sdu_topluluk_data';
    const SESSION_USER_KEY = 'sdu_admin_user';

    // === VERİLERİ KONTROL ET VE EKSİKLERİ TAMAMLA ===
    function ensureCompleteData(parsed) {
        if (!parsed || typeof parsed !== 'object') parsed = {};
        if (!parsed.book || typeof parsed.book !== 'object') {
            parsed.book = JSON.parse(JSON.stringify(DEFAULT_DATA.book));
        }
        if (!parsed.events || !Array.isArray(parsed.events)) {
            parsed.events = JSON.parse(JSON.stringify(DEFAULT_DATA.events));
        }
        if (!parsed.applications || !Array.isArray(parsed.applications)) {
            parsed.applications = JSON.parse(JSON.stringify(DEFAULT_DATA.applications));
        }
        if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
            parsed.suggestions = JSON.parse(JSON.stringify(DEFAULT_DATA.suggestions));
        }
        if (!parsed.users || !Array.isArray(parsed.users)) {
            parsed.users = JSON.parse(JSON.stringify(DEFAULT_DATA.users));
        }
        if (!parsed.developer_messages || !Array.isArray(parsed.developer_messages)) {
            parsed.developer_messages = [];
        }

        // Güvenlik: Master kullanıcının varlığını ve şifresini garanti altına al
        let hasMaster = false;
        parsed.users = parsed.users.map(u => {
            if (u.email.toLowerCase() === 'ilkerm946@gmail.com') {
                hasMaster = true;
                u.role = 'superadmin';
                u.isMaster = true;
                if (!u.password) u.password = 'ilker123';
            }
            return u;
        });

        if (!hasMaster) {
            parsed.users.unshift(DEFAULT_DATA.users[0]);
        }

        // Standalone sdu_submitted_applications anahtarından başvuruları içe aktar ve birleştir
        try {
            const standaloneRaw = localStorage.getItem('sdu_submitted_applications');
            if (standaloneRaw) {
                const sApps = JSON.parse(standaloneRaw);
                if (Array.isArray(sApps)) {
                    sApps.forEach(sApp => {
                        const exists = parsed.applications.some(a => a.id === sApp.id || (a.phone === sApp.phone && a.fullName === sApp.fullName));
                        if (!exists) parsed.applications.unshift(sApp);
                    });
                }
            }
        } catch (e) {}

        return parsed;
    }

    // === VERİ GETİR / KAYDET ===
    let globalDataCache = null;

    async function initData() {
        try {
            const fbData = await getPublicData();
            if (fbData) {
                globalDataCache = ensureCompleteData(fbData);
            } else {
                globalDataCache = ensureCompleteData({});
                await setPublicData(globalDataCache);
            }
        } catch (e) {
            console.error('Veri yükleme hatası:', e);
            globalDataCache = ensureCompleteData({});
        }
    }

    function getData() {
        return globalDataCache || ensureCompleteData({});
    }

    function saveData(data) {
        globalDataCache = data;
        setPublicData(data).catch(e => console.error("Firebase kaydetme hatası:", e));
    }

    // === AKTİF KULLANICI YÖNETİMİ ===
    function getLoggedInUser() {
        try {
            const raw = localStorage.getItem(SESSION_USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function setLoggedInUser(user) {
        if (user) {
            localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(SESSION_USER_KEY);
        }
    }

    // === TOAST BİLDİRİMİ ===
    function showToast(message, icon = 'fas fa-check-circle') {
        const container = document.getElementById('adminToastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // === DOM ELEMANLARI ===
    const authScreen = document.getElementById('authScreen');
    const adminApp = document.getElementById('adminApp');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchToRegisterBtn = document.getElementById('switchToRegisterBtn');
    const switchToLoginBtn = document.getElementById('switchToLoginBtn');
    const loginError = document.getElementById('loginError');
    const regError = document.getElementById('regError');
    const regSuccess = document.getElementById('regSuccess');

    // Sidebar & Profil
    const sidebar = document.getElementById('adminSidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUserBadge = document.getElementById('sidebarUserBadge');
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    const logoutBtn = document.getElementById('logoutBtn');
    const topbarLogoutBtn = document.getElementById('topbarLogoutBtn');
    const adminThemeToggle = document.getElementById('adminThemeToggle');
    const adminThemeIcon = document.getElementById('adminThemeIcon');

    // Super Admin Özel Elemanları
    const superAdminElements = document.querySelectorAll('.superadmin-only');

    // ==========================================
    // TEMA KONTROLÜ
    // ==========================================
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    if (adminThemeToggle) {
        adminThemeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            updateThemeIcon(next);
            showToast(next === 'dark' ? '🌙 Karanlık tema açıldı' : '☀️ Aydınlık tema açıldı', next === 'dark' ? 'fas fa-moon' : 'fas fa-sun');
        });
    }

    function updateThemeIcon(theme) {
        if (!adminThemeIcon) return;
        if (theme === 'dark') {
            adminThemeIcon.classList.remove('fa-moon');
            adminThemeIcon.classList.add('fa-sun');
        } else {
            adminThemeIcon.classList.remove('fa-sun');
            adminThemeIcon.classList.add('fa-moon');
        }
    }

    // ==========================================
    // GİRİŞ & KAYIT İŞLEMLERİ
    // ==========================================
    // Şifre Göster/Gizle Butonları
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            if (!input) return;
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            btn.innerHTML = isPass ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
        });
    });

    if (switchToRegisterBtn) {
        switchToRegisterBtn.addEventListener('click', () => {
            loginForm.style.display = 'none';
            registerForm.style.display = 'flex';
            document.getElementById('authSubtitle').textContent = 'Yeni Yönetim / Üye Kaydı';
            if (loginError) loginError.style.display = 'none';
        });
    }

    if (switchToLoginBtn) {
        switchToLoginBtn.addEventListener('click', () => {
            registerForm.style.display = 'none';
            loginForm.style.display = 'flex';
            document.getElementById('authSubtitle').textContent = 'Yönetim Paneli Giriş Ekranı';
            if (regError) regError.style.display = 'none';
            if (regSuccess) regSuccess.style.display = 'none';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim().toLowerCase();
            const password = document.getElementById('loginPassword').value.trim();
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...';
            }

            try {
                const user = await loginAdmin(email, password);
                
                setLoggedInUser(user);
                initAdminDashboard(user);
                showToast(`Hoş geldiniz, ${user.name}!`, 'fas fa-smile');
                if (loginError) loginError.style.display = 'none';
                loginForm.reset();
            } catch (err) {
                console.warn(err);
                if (loginError) {
                    if (err.message === "NOT_APPROVED") {
                        loginError.innerHTML = '<i class="fas fa-user-lock"></i> <strong>Hesabınız henüz onaylanmadı!</strong><br>Yönetici kaydınız alınmıştır. Güvenlik gereği Yönetici onay verdikten sonra panele giriş yapabilirsiniz.';
                    } else {
                        loginError.textContent = 'Hatalı e-posta veya şifre! Lütfen bilgilerinizi kontrol edin.';
                    }
                    loginError.style.display = 'block';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Giriş Yap <i class="fas fa-arrow-right"></i>';
                }
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim().toLowerCase();
            const role = document.getElementById('regRole').value;
            const password = document.getElementById('regPassword').value.trim();
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kayıt Yapılıyor...';
            }

            const roleTitles = {
                editor: 'İçerik Editörü (Adayı)',
                moderator: 'Başvuru Moderatörü (Adayı)',
                member: 'Topluluk Üyesi'
            };

            try {
                const res = await registerAdmin({
                    name,
                    email,
                    password,
                    requestedRole: role,
                    title: roleTitles[role] || 'Yönetici Adayı (Onay Bekliyor)'
                });

                if (regError) regError.style.display = 'none';
                if (res.autoAccepted) {
                    const newUser = {
                        id: res.id,
                        name: res.name,
                        email: res.email,
                        role: res.role,
                        title: res.title
                    };
                    setLoggedInUser(newUser);
                    authScreen.style.display = 'none';
                    adminApp.style.display = 'flex';
                    initAdminDashboard(newUser);
                    showToast('Otomatik onay ile giriş yapıldı.', 'fas fa-check-circle');
                    registerForm.reset();
                    return; // Return early, skip timeout
                }

                if (regSuccess) {
                    regSuccess.innerHTML = '<i class="fas fa-shield-alt"></i> <strong>Kaydınız başarıyla alındı!</strong><br>Güvenlik gereği Yönetici onayladıktan sonra hesabınız aktifleşecektir.';
                    regSuccess.style.display = 'block';
                }
                registerForm.reset();
                setTimeout(() => {
                    switchToLoginBtn.click();
                    if (regSuccess) regSuccess.style.display = 'none';
                }, 3000);
            } catch (err) {
                console.warn(err);
                if (regError) {
                    regError.textContent = err.message || 'Kayıt sırasında bir hata oluştu.';
                    regError.style.display = 'block';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Kayıt Ol';
                }
            }
        });
    }

    function handleLogout() {
        setLoggedInUser(null);
        adminApp.style.display = 'none';
        authScreen.style.display = 'flex';
        if (loginForm) {
            loginForm.reset();
            loginForm.style.display = 'flex';
        }
        if (registerForm) {
            registerForm.reset();
            registerForm.style.display = 'none';
        }
        const authSubtitle = document.getElementById('authSubtitle');
        if (authSubtitle) authSubtitle.textContent = 'Yönetim Paneli Giriş Ekranı';
        if (loginError) loginError.style.display = 'none';
        if (regError) regError.style.display = 'none';
        if (regSuccess) regSuccess.style.display = 'none';
        showToast('Oturum kapatıldı.', 'fas fa-sign-out-alt');
    }

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (topbarLogoutBtn) topbarLogoutBtn.addEventListener('click', handleLogout);

    // ==========================================
    // YÖNETİM PANELİ BAŞLATMA & ROL YETKİLENDİRME
    // ==========================================
    async function initAdminDashboard(user) {
        authScreen.style.display = 'none';
        adminApp.style.display = 'flex';
        
        await initData();

        // Profil Bilgilerini Bas
        if (sidebarUserName) sidebarUserName.textContent = user.name;
        if (sidebarUserAvatar) {
            const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            sidebarUserAvatar.textContent = initials || 'K';
        }

        const isSuperAdmin = user.email.toLowerCase() === 'ilkerm946@gmail.com' || user.role === 'superadmin';

        if (sidebarUserBadge) {
            if (isSuperAdmin) {
                sidebarUserBadge.innerHTML = '👑 Süper Admin';
                sidebarUserBadge.style.color = 'var(--accent-gold)';
            } else if (user.role === 'editor') {
                sidebarUserBadge.innerHTML = '✍️ İçerik Editörü';
            } else if (user.role === 'moderator') {
                sidebarUserBadge.innerHTML = '🛡️ Moderatör';
            } else {
                sidebarUserBadge.innerHTML = '👤 Topluluk Üyesi';
            }
        }

        // KULLANICI İSTEĞİ: "Hayır diğer yöneticiler sadece sade kısmı görsün. İşin komplex tarafları sadece benim hesabımda görünebilir olsun. Yedek kısmı falan."
        superAdminElements.forEach(el => {
            if (isSuperAdmin) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });

        // Overview Bilgileri
        const overviewUserName = document.getElementById('overviewUserName');
        if (overviewUserName) overviewUserName.textContent = user.name.split(' ')[0];

        const overviewUserRoleBadge = document.getElementById('overviewUserRoleBadge');
        if (overviewUserRoleBadge) {
            overviewUserRoleBadge.innerHTML = isSuperAdmin 
                ? '<i class="fas fa-crown"></i> Süper Admin Yetkisi (Tam Yetki)' 
                : `<i class="fas fa-shield-alt"></i> ${user.title || 'Yönetici'} Yetkisi`;
        }

        // Verileri Yükle ve Arayüzü Doldur
        renderAllSections();
        switchAdminTab('overview');
    }

    // ==========================================
    // SEKME DEĞİŞTİRME MEKANİZMASI
    // ==========================================
    const tabNavItems = document.querySelectorAll('.sidebar-nav .nav-item[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const topbarTitle = document.getElementById('topbarTitle');
    const topbarSubtitle = document.getElementById('topbarSubtitle');

    const TAB_HEADERS = {
        overview: { title: 'Genel Bakış', subtitle: 'Topluluk güncel istatistikleri ve durum özeti' },
        book: { title: 'Ayın Kitabı', subtitle: 'Sitede vitrinde duran kitabı ve okuma ilerlemesini düzenle' },
        events: { title: 'Etkinlik Yönetimi', subtitle: 'Yeni etkinlik ekle, düzenle veya takvime işle' },
        applications: { title: 'Gelen Başvurular', subtitle: 'Öğrencilerden gelen katılım formlarını incele' },
        members: { title: 'Üyeler (Hızlı Kayıt)', subtitle: 'Siteden hızlı kayıt olan aktif topluluk üyeleri' },
        gallery: { title: 'Galeri Yönetimi', subtitle: 'Ana sayfada sergilenen etkinlik fotoğraflarını yönetin' },
        suggestions: { title: 'Etkinlik Önerileri', subtitle: 'Öğrencilerin gönderdiği etkinlik fikirleri havuzu' },
        broadcast: { title: 'WhatsApp Bülteni', subtitle: 'Gruba atılacak hazır şablonlu etkinlik duyurusu üret' },
        users: { title: 'Kullanıcılar & Roller', subtitle: 'Yönetim ekibi yetkilerini ve rollerini düzenle' },
        backup: { title: 'Yedekleme & Sıfırlama', subtitle: 'Verileri JSON dosyası olarak indir veya geri yükle' },
        guide: { title: 'Kullanım Rehberi', subtitle: 'Yönetim kurulu için adım adım pratik ipuçları' }
    };

    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    }

    window.switchAdminTab = function (tabKey) {
        tabNavItems.forEach(btn => {
            if (btn.dataset.tab === tabKey) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        tabPanes.forEach(pane => {
            if (pane.id === `pane-${tabKey}`) pane.classList.add('active');
            else pane.classList.remove('active');
        });

        if (TAB_HEADERS[tabKey]) {
            if (topbarTitle) topbarTitle.textContent = TAB_HEADERS[tabKey].title;
            if (topbarSubtitle) topbarSubtitle.textContent = TAB_HEADERS[tabKey].subtitle;
        }

        // Mobilde sidebar'ı otomatik kapat
        closeSidebar();
    };

    tabNavItems.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabKey = btn.dataset.tab;
            if (tabKey) switchAdminTab(tabKey);
            
            // Mobil uyumluluk: Telefondan sekmeye basınca menüyü kapat
            if (window.innerWidth <= 992) {
                closeSidebar();
            }
        });
    });

    const btnRefreshApps = document.getElementById('btnRefreshApps');
    if (btnRefreshApps) {
        btnRefreshApps.addEventListener('click', () => {
            renderApplicationsSection(true);
            showToast('Başvuru listesi yenilendi.', 'fas fa-sync-alt');
        });
    }
    
    const btnRefreshMembers = document.getElementById('btnRefreshMembers');
    if (btnRefreshMembers) {
        btnRefreshMembers.addEventListener('click', () => {
            renderMembersSection(true);
            showToast('Üye listesi yenilendi.', 'fas fa-sync-alt');
        });
    }

    const btnRefreshSuggs = document.getElementById('btnRefreshSuggs');
    if (btnRefreshSuggs) {
        btnRefreshSuggs.addEventListener('click', () => {
            renderSuggestionsSection();
            showToast('Öneriler listesi yenilendi.', 'fas fa-sync-alt');
        });
    }

    // Mobil Menü Aç/Kapat & Dışarı Tıklama / Backdrop
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar && sidebar.classList.contains('open')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', closeSidebar);
    }
    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeSidebar);
    }
    document.addEventListener('click', (e) => {
        if (sidebar && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !sidebarToggleBtn?.contains(e.target)) {
                closeSidebar();
            }
        }
    });

    // ==========================================
    // TÜM BÖLÜMLERİ RENDER ETME
    // ==========================================
    function renderAllSections() {
        const data = getData();
        renderOverview(data);
        renderBookSection(data);
        renderEventsSection(data);
        renderApplicationsSection(data);
        renderMembersSection();
        renderSuggestionsSection(data);
        renderBroadcastSection(data);
        renderUsersSection(data);
        renderDevMessagesSection(data);
        renderGallerySection(data);
    }

    // 1. GENEL BAKIŞ
    async function renderOverview(data) {
        document.getElementById('statBookTitle').textContent = data.book.title || 'Belirtilmedi';
        document.getElementById('statBookProgress').textContent = `%${data.book.progress || 0} Tamamlandı`;
        document.getElementById('statEventCount').textContent = data.events.length;
        
        let apps = [];
        let suggs = [];
        let members = [];
        try {
            apps = await getApplications();
            suggs = await getSuggestions();
            members = await getMembers();
        } catch(e) {
            console.error('Error fetching stats for overview:', e);
        }

        const pendingCount = apps.filter(a => a.status === 'Beklemede').length;
        const statAppCountEl = document.getElementById('statApplicationCount');
        if (statAppCountEl) statAppCountEl.textContent = apps.length;
        const statPendingEl = document.getElementById('statPendingApps');
        if (statPendingEl) statPendingEl.textContent = `${pendingCount} beklemede`;

        const suggCount = suggs.length;
        const statSuggEl = document.getElementById('statSuggestionCount');
        if (statSuggEl) statSuggEl.textContent = suggCount;

        const statMemCountEl = document.getElementById('statMemberCount');
        const statNewMemEl = document.getElementById('statNewMembersToday');
        if (statMemCountEl) {
            statMemCountEl.textContent = members.length;
            const today = new Date().toLocaleDateString('tr-TR');
            const todayCount = members.filter(m => {
                if (!m.registeredAt) return false;
                const d = new Date(m.registeredAt);
                return d.toLocaleDateString('tr-TR') === today;
            }).length;
            if (statNewMemEl) statNewMemEl.textContent = `${todayCount} bugün`;
        }

        const devMsgCount = data.developer_messages ? data.developer_messages.length : 0;
        const devMsgCountEl = document.getElementById('devMsgCount');
        if (devMsgCountEl) devMsgCountEl.textContent = devMsgCount;

        // Badge counters
        const badgeApps = document.getElementById('badgeApplications');
        if (badgeApps) badgeApps.textContent = pendingCount;
        const badgeSugg = document.getElementById('badgeSuggestions');
        if (badgeSugg) badgeSugg.textContent = suggCount;
    }

    // 2. AYIN KİTABI
    function renderBookSection(data) {
        const b = data.book;
        document.getElementById('bookMonthTag').value = b.monthTag || '';
        document.getElementById('bookTitle').value = b.title || '';
        document.getElementById('bookAuthor').value = b.author || '';
        document.getElementById('bookGenre').value = b.genre || '';
        document.getElementById('bookPages').value = b.pages || '';
        document.getElementById('bookReaders').value = b.readers || '';
        document.getElementById('bookMeetingDate').value = b.meetingDate || '';
        document.getElementById('bookMeetingPlace').value = b.meetingPlace || '';
        document.getElementById('bookProgress').value = b.progress || 0;
        document.getElementById('progressValueDisplay').textContent = b.progress || 0;
        document.getElementById('bookQuote').value = b.quote || '';
        document.getElementById('bookSynopsis').value = b.synopsis || '';
    }

    const bookProgressInput = document.getElementById('bookProgress');
    if (bookProgressInput) {
        bookProgressInput.addEventListener('input', (e) => {
            document.getElementById('progressValueDisplay').textContent = e.target.value;
        });
    }

    const saveBookBtn = document.getElementById('saveBookBtn');
    if (saveBookBtn) {
        saveBookBtn.addEventListener('click', () => {
            const data = getData();
            data.book = {
                monthTag: document.getElementById('bookMonthTag').value.trim(),
                title: document.getElementById('bookTitle').value.trim(),
                author: document.getElementById('bookAuthor').value.trim(),
                genre: document.getElementById('bookGenre').value.trim(),
                pages: document.getElementById('bookPages').value.trim(),
                readers: document.getElementById('bookReaders').value.trim(),
                meetingDate: document.getElementById('bookMeetingDate').value.trim(),
                meetingPlace: document.getElementById('bookMeetingPlace').value.trim(),
                progress: parseInt(document.getElementById('bookProgress').value) || 0,
                quote: document.getElementById('bookQuote').value.trim(),
                synopsis: document.getElementById('bookSynopsis').value.trim()
            };
            saveData(data);
            renderOverview(data);
            showToast('📖 Ayın Kitabı başarıyla kaydedildi! Sitede güncellendi.', 'fas fa-check-circle');
        });
    }

    const bookForm = document.getElementById('bookForm');
    if (bookForm) {
        bookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (saveBookBtn) saveBookBtn.click();
        });
    }

    // 3. ETKİNLİKLER
    function renderEventsSection(data) {
        const tbody = document.getElementById('eventsTableBody');
        const countEl = document.getElementById('eventListCount');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (countEl) countEl.textContent = data.events.length;

        if (data.events.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px;">Henüz kayıtlı etkinlik bulunmuyor.</td></tr>`;
            return;
        }

        data.events.forEach(ev => {
            const count = (ev.participants && Array.isArray(ev.participants)) ? ev.participants.length : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${ev.title}</strong></td>
                <td><span class="table-tag tag-${ev.category}">${ev.category.toUpperCase()}</span></td>
                <td><i class="far fa-clock"></i> ${ev.date} (${ev.time || '14:00'})</td>
                <td><i class="fas fa-map-marker-alt"></i> ${ev.place}</td>
                <td><span class="table-tag tag-kitap"><i class="fas fa-users"></i> ${count} Katılımcı</span></td>
                <td><span class="table-tag tag-status-approved">${ev.badge || 'Aktif'}</span></td>
                <td>
                    <button class="btn-icon-action delete" title="Etkinliği Sil" onclick="deleteEvent(${ev.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const addEventForm = document.getElementById('addEventForm');
    if (addEventForm) {
        addEventForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = getData();
            const newEvent = {
                id: Date.now(),
                title: document.getElementById('eventTitle').value.trim(),
                category: document.getElementById('eventCategory').value,
                date: document.getElementById('eventDate').value.trim(),
                time: document.getElementById('eventTime').value.trim(),
                place: document.getElementById('eventPlace').value.trim(),
                badge: document.getElementById('eventBadge').value,
                desc: document.getElementById('eventDesc').value.trim(),
                icon: document.getElementById('eventCategory').value === 'kitap' ? 'fas fa-book' : 
                      document.getElementById('eventCategory').value === 'gezi' ? 'fas fa-bus' : 'fas fa-microphone'
            };

            data.events.push(newEvent);
            saveData(data);
            renderEventsSection(data);
            renderOverview(data);
            renderBroadcastSection(data);
            addEventForm.reset();
            showToast(`📅 "${newEvent.title}" etkinliği yayınlandı!`, 'fas fa-calendar-check');
        });
    }

    window.deleteEvent = function (id) {
        if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
        const data = getData();
        data.events = data.events.filter(e => e.id !== id);
        saveData(data);
        renderEventsSection(data);
        renderOverview(data);
        renderBroadcastSection(data);
        showToast('Etkinlik silindi.', 'fas fa-trash-alt');
    };

    // 4. GELEN BAŞVURULAR
    let cachedApplications = null;

    async function renderApplicationsSection(forceRefresh = false) {
        const tbody = document.getElementById('applicationsTableBody');
        const countEl = document.getElementById('appTotalCount');
        if (!tbody) return;

        if (forceRefresh || cachedApplications === null) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Yükleniyor...</td></tr>';
            try {
                cachedApplications = await getApplications();
            } catch (e) {
                console.error('Error fetching applications:', e);
                cachedApplications = [];
            }
        }

        const apps = cachedApplications || [];
        if (countEl) countEl.textContent = apps.length;

        const searchVal = (document.getElementById('searchAppInput')?.value || '').toLowerCase().trim();
        const filtered = searchVal ? apps.filter(a => 
            (a.fullName || '').toLowerCase().includes(searchVal) ||
            (a.department || '').toLowerCase().includes(searchVal) ||
            (a.phone || '').includes(searchVal)
        ) : apps;

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px;">Başvuru bulunamadı.</td></tr>`;
            return;
        }

        filtered.forEach(app => {
            const tr = document.createElement('tr');
            const cleanPhone = (app.phone || '').replace(/\D/g, '');
            const waPhone = cleanPhone.startsWith('90') ? cleanPhone : (cleanPhone.startsWith('0') ? '9' + cleanPhone : '90' + cleanPhone);
            const magicLink = window.location.origin + window.location.pathname + '?token=' + app.id;
            const waMsg = encodeURIComponent(`Merhaba ${app.fullName}! SDÜ Kültür ve Kitap Topluluğu yönetiminden yazıyorum. Aramıza katılım başvurunuz onaylandı, hoş geldiniz! 🎉\n\nYönetim paneline şifresiz direkt giriş linkin:\n${magicLink}`);

            tr.innerHTML = `
                <td><strong>${app.fullName || '-'}</strong></td>
                <td>${app.department || '-'} <span style="color:var(--text-muted);">(${app.grade || '-'})</span></td>
                <td>
                    ${app.phone || '-'}
                    ${app.phone ? `<a href="https://wa.me/${waPhone}?text=${waMsg}" target="_blank" class="btn-icon-action whatsapp" title="WhatsApp'tan Mesaj At (Giriş Linki İçerir)">
                        <i class="fab fa-whatsapp"></i>
                    </a>` : ''}
                    ${app.status === 'Onaylandı' ? `<button class="btn-icon-action" style="background:#f3f4f6; color:#4b5563; margin-left:4px;" title="Giriş Linkini Kopyala" onclick="copyMagicLink('${app.id}')"><i class="fas fa-link"></i></button>` : ''}
                </td>
                <td><small>${app.interest || 'Genel'}</small></td>
                <td><small>${app.date || '-'}</small></td>
                <td>
                    <span class="table-tag ${app.status === 'Onaylandı' ? 'tag-status-approved' : 'tag-status-pending'}" 
                          style="cursor:pointer;" title="Durumu Değiştirmek İçin Tıkla" onclick="toggleAppStatus('${app.id}', '${app.status}')">
                        ${app.status || 'Beklemede'}
                    </span>
                </td>
                <td>
                    <button class="btn-icon-action delete" title="Sil" onclick="deleteApp('${app.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.copyMagicLink = function(id) {
        const link = window.location.origin + window.location.pathname + '?token=' + id;
        navigator.clipboard.writeText(link).then(() => {
            showToast('Otomatik giriş linki kopyalandı! Üyeye gönderebilirsiniz.', 'fas fa-link');
        }).catch(err => {
            console.error('Could not copy text: ', err);
            showToast('Link kopyalanamadı.', 'fas fa-exclamation-triangle');
        });
    }

    const searchAppInput = document.getElementById('searchAppInput');
    if (searchAppInput) {
        let appSearchTimer = null;
        searchAppInput.addEventListener('input', () => {
            clearTimeout(appSearchTimer);
            appSearchTimer = setTimeout(() => {
                renderApplicationsSection(false);
            }, 100);
        });
    }

    window.toggleAppStatus = async function (id, currentStatus) {
        const newStatus = currentStatus === 'Onaylandı' ? 'Beklemede' : 'Onaylandı';
        try {
            await updateApplicationStatus(id, newStatus);
            await renderApplicationsSection(true);
            showToast(`Başvuru durumu: ${newStatus}`, 'fas fa-info-circle');
        } catch (e) {
            console.error(e);
            showToast('Durum güncellenirken bir hata oluştu.', 'fas fa-exclamation-triangle');
        }
    };

    window.deleteApp = async function (id) {
        if (!confirm('Bu başvuruyu silmek istediğinize emin misiniz?')) return;
        try {
            await fbDeleteApplication(id);
            await renderApplicationsSection(true);
            showToast('Başvuru silindi.', 'fas fa-trash-alt');
        } catch (e) {
            console.error(e);
            showToast('Silinirken hata oluştu.', 'fas fa-exclamation-triangle');
        }
    };

    // 4.5 ÜYELER (HIZLI KAYIT)
    let cachedMembers = null;

    async function renderMembersSection(forceRefresh = false) {
        const tbody = document.getElementById('membersTableBody');
        const countEl = document.getElementById('memberTotalCount');
        const badgeEl = document.getElementById('badgeMembers');
        if (!tbody) return;

        if (forceRefresh || cachedMembers === null) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Yükleniyor...</td></tr>';
            try {
                cachedMembers = await getMembers();
                // Sort members by registered date descending
                cachedMembers.sort((a, b) => {
                    const dateA = a.registeredAt ? new Date(a.registeredAt) : new Date(0);
                    const dateB = b.registeredAt ? new Date(b.registeredAt) : new Date(0);
                    return dateB - dateA;
                });
            } catch(e) {
                console.error('Error fetching members:', e);
                cachedMembers = [];
            }
        }

        const members = cachedMembers || [];
        if (countEl) countEl.textContent = members.length;
        if (badgeEl) {
            badgeEl.textContent = members.length;
            badgeEl.style.display = members.length > 0 ? 'inline-block' : 'none';
        }

        const searchVal = (document.getElementById('searchMemberInput')?.value || '').toLowerCase().trim();
        const filtered = searchVal ? members.filter(m => 
            (m.name || '').toLowerCase().includes(searchVal) ||
            (m.identifier || '').toLowerCase().includes(searchVal) ||
            (m.department || '').toLowerCase().includes(searchVal)
        ) : members;

        tbody.innerHTML = '';
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Henüz hızlı kayıt ile katılan üye yok.</td></tr>`;
            return;
        }

        filtered.forEach(m => {
            const tr = document.createElement('tr');
            
            // Handle date formatting
            let dateStr = '-';
            if (m.registeredAt) {
                const d = new Date(m.registeredAt);
                dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
            }
            
            tr.innerHTML = `
                <td><strong>${m.name || 'İsimsiz'}</strong></td>
                <td>${m.identifier || '-'}</td>
                <td>${m.department || '-'} ${m.grade ? `<span style="color:var(--text-muted);">(${m.grade})</span>` : ''}</td>
                <td>${dateStr}</td>
                <td><span class="table-tag tag-kitap">${['member', 'üye', 'Ã¼ye'].includes(m.role) ? 'Üye' : m.role}</span></td>
                <td>
                    <button class="btn-icon-action delete" onclick="deleteMember('${m.id}')" title="Üyeyi Sil"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const searchMemberInput = document.getElementById('searchMemberInput');
    if (searchMemberInput) {
        let memberSearchTimer = null;
        searchMemberInput.addEventListener('input', () => {
            clearTimeout(memberSearchTimer);
            memberSearchTimer = setTimeout(() => {
                renderMembersSection(false);
            }, 100);
        });
    }

    window.deleteMember = async function(id) {
        if (!confirm('⚠️ BU ÜYEYİ SİLMEK İSTEDİĞİNİZE EMİN MİSİNİZ?\n\nBu üyeyi sildiğinizde, üyenin sitedeki aktif oturumu otomatik olarak kapatılacak ve hesabı tamamen silinecektir.')) return;
        try {
            // Tell Firebase to delete it
            await fbDeleteMember(id);
            await renderMembersSection(true);
            showToast('Üye silindi.', 'fas fa-trash-alt');
        } catch(e) {
            console.error('Error deleting member:', e);
            showToast('Üye silinirken bir hata oluştu.', 'fas fa-exclamation-triangle');
        }
    };



    // 5. ETKİNLİK ÖNERİLERİ
    async function renderSuggestionsSection() {
        const tbody = document.getElementById('suggestionsTableBody');
        const countEl = document.getElementById('suggTotalCount');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Yükleniyor...</td></tr>';

        let list = [];
        try {
            list = await getSuggestions();
        } catch (e) {
            console.error(e);
        }

        if (countEl) countEl.textContent = list.length;
        tbody.innerHTML = '';

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:24px;">Henüz etkinlik önerisi gelmedi.</td></tr>`;
            return;
        }

        list.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${s.name || '-'}</strong></td>
                <td>${s.department || '-'}</td>
                <td><strong>${s.title || '-'}</strong></td>
                <td><small>${s.desc || '-'}</small></td>
                <td><small>${s.date || '-'}</small></td>
                <td>
                    <span class="table-tag ${s.status === 'Kabul Edildi' ? 'tag-status-approved' : 'tag-status-pending'}" 
                          style="cursor:pointer;" title="Durumu Değiştirmek İçin Tıkla" onclick="toggleSuggestionStatus('${s.id}', '${s.status}')">
                        ${s.status || 'Değerlendiriliyor'}
                    </span>
                </td>
                <td>
                    <button class="btn-icon-action delete" title="Sil" onclick="deleteSuggestion('${s.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.toggleSuggestionStatus = async function (id, currentStatus) {
        const newStatus = currentStatus === 'Kabul Edildi' ? 'Değerlendiriliyor' : 'Kabul Edildi';
        try {
            await updateSuggestionStatus(id, newStatus);
            renderSuggestionsSection();
            showToast(`Öneri durumu: ${newStatus}`, 'fas fa-check');
        } catch (e) {
            console.error(e);
            showToast('Durum güncellenemedi.', 'fas fa-exclamation-triangle');
        }
    };

    window.deleteSuggestion = async function (id) {
        if (!confirm('Bu öneriyi silmek istediğinize emin misiniz?')) return;
        try {
            await fbDeleteSuggestion(id);
            renderSuggestionsSection();
            showToast('Öneri silindi.', 'fas fa-trash-alt');
        } catch (e) {
            console.error(e);
            showToast('Öneri silinemedi.', 'fas fa-exclamation-triangle');
        }
    };

    // 6. WHATSAPP BÜLTENİ
    function renderBroadcastSection(data) {
        const eventSelect = document.getElementById('broadcastEventSelect');
        if (!eventSelect) return;
        eventSelect.innerHTML = '';
        data.events.forEach(ev => {
            const opt = document.createElement('option');
            opt.value = ev.id;
            opt.textContent = `${ev.title} (${ev.date})`;
            eventSelect.appendChild(opt);
        });
    }

    const broadcastType = document.getElementById('broadcastType');
    const broadcastEventGroup = document.getElementById('broadcastEventSelectorGroup');
    if (broadcastType) {
        broadcastType.addEventListener('change', () => {
            if (broadcastType.value === 'event') {
                broadcastEventGroup.style.display = 'flex';
            } else {
                broadcastEventGroup.style.display = 'none';
            }
        });
    }

    const generateBroadcastBtn = document.getElementById('generateBroadcastBtn');
    if (generateBroadcastBtn) {
        generateBroadcastBtn.addEventListener('click', () => {
            const data = getData();
            const type = broadcastType.value;
            const extra = document.getElementById('broadcastExtraNote').value.trim();
            const out = document.getElementById('broadcastOutput');

            let message = '';

            if (type === 'book') {
                const b = data.book;
                message = `📚 *SDÜ KÜLTÜR VE KİTAP TOPLULUĞU* 📚\n` +
                          `📢 *Ayın Kitabı Tahlil Oturumu Duyurusu*\n\n` +
                          `Değerli Kitap Dostları,\n` +
                          `Bu ay hep birlikte okuduğumuz *"${b.title}"* (${b.author}) eserinin tahlili için bir araya geliyoruz!\n\n` +
                          `🗓 *Tarih:* ${b.meetingDate}\n` +
                          `📍 *Yer:* ${b.meetingPlace}\n` +
                          `📖 *Kitap:* ${b.title} (${b.pages} Sayfa)\n\n` +
                          (extra ? `📌 *Önemli Not:* ${extra}\n\n` : '') +
                          `Tüm üniversitemiz ve edebiyatseverler davetlidir. Çaylar bizden, derin sohbet sizden! ☕✨\n\n` +
                          `🔗 Sitemiz: https://ilker-eee.github.io/kultur-kitap-toplulugu/`;
            } else if (type === 'event') {
                const eventSel = document.getElementById('broadcastEventSelect');
                const selId = eventSel ? parseInt(eventSel.value) : NaN;
                const events = data.events || [];
                const ev = events.find(e => e.id === selId) || events[0];
                if (!ev) {
                    showToast('Duyuru oluşturmak için en az bir etkinlik bulunmalıdır.', 'fas fa-exclamation-triangle');
                    return;
                }
                message = `✨ *SDÜ KÜLTÜR VE KİTAP TOPLULUĞU ETKİNLİK DUYURUSU* ✨\n\n` +
                          `🎯 *${ev.title}*\n` +
                          `🗓 *Tarih:* ${ev.date} | ⏰ *Saat:* ${ev.time || '14:00'}\n` +
                          `📍 *Yer:* ${ev.place}\n\n` +
                          `ℹ️ *Açıklama:* ${ev.desc}\n\n` +
                          (extra ? `📌 *Not:* ${extra}\n\n` : '') +
                          `Kontenjan ve hazırlıklar için yerinizi ayırtmayı unutmayın!\n` +
                          `🔗 Detaylar: https://ilker-eee.github.io/kultur-kitap-toplulugu/`;
            } else if (type === 'welcome') {
                message = `🎉 *AİLEMİZE HOŞ GELDİNİZ!* 🎉\n\n` +
                          `SDÜ Kültür ve Kitap Topluluğu'na yeni katılan tüm arkadaşlarımızı sevgiyle selamlıyoruz! 📖✨\n\n` +
                          `Topluluğumuzda her ay birlikte kitap okuyor, tahliller yapıyor, yazar söyleşileri ve kültür gezileri düzenliyoruz.\n\n` +
                          (extra ? `📌 *Duyuru:* ${extra}\n\n` : '') +
                          `Etkinlik takvimimiz ve detaylar için web sitemizi ziyaret edebilirsiniz:\n` +
                          `👉 https://ilker-eee.github.io/kultur-kitap-toplulugu/`;
            } else {
                message = `📢 *SDÜ KÜLTÜR VE KİTAP TOPLULUĞU BİLGİLENDİRME* 📢\n\n` +
                          (extra || 'Değerli üyelerimiz, etkinlik takvimimiz güncellenmiştir!') + `\n\n` +
                          `👉 Detaylar: https://ilker-eee.github.io/kultur-kitap-toplulugu/`;
            }

            out.value = message;
            showToast('Duyuru metni oluşturuldu!', 'fas fa-magic');
        });
    }

    const copyBroadcastBtn = document.getElementById('copyBroadcastBtn');
    if (copyBroadcastBtn) {
        copyBroadcastBtn.addEventListener('click', () => {
            const out = document.getElementById('broadcastOutput');
            if (!out.value) {
                showToast('Önce duyuru metnini oluşturun!', 'fas fa-exclamation');
                return;
            }
            navigator.clipboard.writeText(out.value).then(() => {
                showToast('Metin panoya kopyalandı!', 'fas fa-copy');
            });
        });
    }

    const openWhatsAppBtn = document.getElementById('openWhatsAppBtn');
    if (openWhatsAppBtn) {
        openWhatsAppBtn.addEventListener('click', () => {
            const out = document.getElementById('broadcastOutput');
            if (!out.value) {
                showToast('Önce duyuru metnini oluşturun!', 'fas fa-exclamation');
                return;
            }
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(out.value)}`;
            window.open(url, '_blank');
        });
    }

    // 7. KULLANICILAR & ROLLER (SADECE SÜPER ADMİN)
    async function renderUsersSection() {
        const tbody = document.getElementById('usersTableBody');
        const pendingTbody = document.getElementById('pendingUsersTableBody');
        const pendingCountEl = document.getElementById('pendingUsersCount');
        const badgeUsers = document.getElementById('badgeUsers');
        
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Yükleniyor...</td></tr>';
        if (pendingTbody) pendingTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Yükleniyor...</td></tr>';

        let adminUsers = [];
        try {
            adminUsers = await getAdmins();
        } catch (e) {
            console.error('Error fetching admins:', e);
        }

        if (tbody) tbody.innerHTML = '';
        if (pendingTbody) pendingTbody.innerHTML = '';

        // Auto Accept Toggle State
        const autoAcceptToggle = document.getElementById('autoAcceptToggle');
        if (autoAcceptToggle) {
            try {
                autoAcceptToggle.checked = await getAutoAcceptSetting();
            } catch (e) { console.error('Error fetching auto accept state:', e); }
            
            autoAcceptToggle.onchange = async (e) => {
                const val = e.target.checked;
                autoAcceptToggle.disabled = true;
                try {
                    await setAutoAcceptSetting(val);
                    showToast(val ? 'Otomatik Onay sistemi AKTİF edildi.' : 'Güvenlik filtreli kayıt AKTİF edildi.', val ? 'fas fa-shield-virus' : 'fas fa-shield-alt');
                } catch (err) {
                    console.error('Error setting auto accept:', err);
                    showToast('Ayarlar güncellenemedi!', 'fas fa-exclamation-triangle');
                    autoAcceptToggle.checked = !val; // revert
                } finally {
                    autoAcceptToggle.disabled = false;
                }
            };
        }

        const pendingUsers = adminUsers.filter(u => u.status === 'pending_approval');
        const activeUsers = adminUsers.filter(u => u.status !== 'pending_approval');

        if (pendingCountEl) pendingCountEl.textContent = pendingUsers.length;
        if (badgeUsers) {
            badgeUsers.textContent = pendingUsers.length;
            badgeUsers.style.display = pendingUsers.length > 0 ? 'inline-block' : 'none';
        }

        // Onay Bekleyen Tablosu
        if (pendingTbody) {
            if (pendingUsers.length === 0) {
                pendingTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:16px;">Şu an onay bekleyen bir yönetici başvurusu bulunmuyor.</td></tr>`;
            } else {
                pendingUsers.forEach(u => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${u.name}</strong></td>
                        <td><code>${u.email}</code></td>
                        <td><span class="table-tag tag-soylesi">${u.requestedRole === 'editor' ? 'İçerik Editörü' : (u.requestedRole === 'moderator' ? 'Başvuru Moderatörü' : 'Üye')}</span></td>
                        <td><small>${u.registeredAt ? new Date(u.registeredAt).toLocaleDateString('tr-TR') : '-'}</small></td>
                        <td>
                            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                                <button type="button" class="btn-primary-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="approveUser('${u.id}', 'editor')">
                                    <i class="fas fa-check"></i> Editör Yap
                                </button>
                                <button type="button" class="btn-outline-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="approveUser('${u.id}', 'moderator')">
                                    <i class="fas fa-shield-alt"></i> Moderatör Yap
                                </button>
                                <button type="button" class="btn-danger-sm" style="padding:4px 8px; font-size:0.75rem;" onclick="deleteUser('${u.id}')">
                                    <i class="fas fa-times"></i> Reddet
                                </button>
                            </div>
                        </td>
                    `;
                    pendingTbody.appendChild(tr);
                });
            }
        }

        // Aktif Kullanıcılar Tablosu
        if (tbody) {
            if (activeUsers.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:16px;">Sistemde şu an aktif yönetici bulunmuyor.</td></tr>`;
            } else {
                activeUsers.forEach(u => {
                    const tr = document.createElement('tr');
                    const isMaster = u.email === 'ilkerm946@gmail.com' || u.isMaster;

                    tr.innerHTML = `
                        <td>
                            <strong>${u.name}</strong>
                            ${isMaster ? ' <span class="badge-lock" style="font-size:0.7rem; padding:2px 6px;">Yönetici</span>' : ''}
                        </td>
                        <td><code>${u.email}</code></td>
                        <td><span class="table-tag ${isMaster ? 'tag-kitap' : 'tag-soylesi'}">${u.title || u.role}</span></td>
                        <td>
                            ${isMaster ? '<em>(Değiştirilemez)</em>' : `
                                <select onchange="changeUserRole('${u.id}', this.value)" style="padding:4px 8px; border-radius:6px; border:1px solid var(--border-color); background:var(--bg-surface); color:var(--text-primary);">
                                    <option value="editor" ${u.role === 'editor' ? 'selected' : ''}>İçerik Editörü</option>
                                    <option value="moderator" ${u.role === 'moderator' ? 'selected' : ''}>Başvuru Moderatörü</option>
                                    <option value="member" ${u.role === 'member' ? 'selected' : ''}>Topluluk Üyesi</option>
                                </select>
                            `}
                        </td>
                        <td>
                            ${isMaster ? '-' : `
                                <button class="btn-icon-action delete" title="Kullanıcıyı Sil" onclick="deleteUser('${u.id}')">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            `}
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
    }

    window.approveUser = async function (id, assignedRole) {
        const titles = {
            editor: 'İçerik Editörü',
            moderator: 'Başvuru Moderatörü',
            member: 'Topluluk Üyesi'
        };
        const title = titles[assignedRole] || 'Yönetici';
        
        try {
            await approveAdmin(id, assignedRole, title);
            renderUsersSection();
            showToast(`✅ Kullanıcı ${title} olarak onaylandı! Artık giriş yapabilir.`, 'fas fa-user-check');
        } catch (e) {
            console.error(e);
            showToast('Onaylama başarısız oldu.', 'fas fa-exclamation-circle');
        }
    };

    window.changeUserRole = async function (id, newRole) {
        const titles = {
            editor: 'İçerik Editörü',
            moderator: 'Başvuru Moderatörü',
            member: 'Topluluk Üyesi'
        };
        const title = titles[newRole] || 'Yönetici';
        try {
            await approveAdmin(id, newRole, title); // Re-using approveAdmin to update role/title
            renderUsersSection();
            showToast('Rol başarıyla güncellendi.', 'fas fa-check-circle');
        } catch (e) {
            console.error(e);
            showToast('Güncelleme başarısız oldu.', 'fas fa-exclamation-circle');
        }
    };

    window.deleteUser = async function (id) {
        if (!confirm('Bu yöneticiyi sistemden silmek istediğinize emin misiniz?')) return;
        try {
            await fbDeleteAdmin(id);
            renderUsersSection();
            showToast('Yönetici başarıyla silindi.', 'fas fa-trash-alt');
        } catch (e) {
            console.error(e);
            showToast('Silme başarısız oldu.', 'fas fa-exclamation-circle');
        }
    };

    // 8. YEDEKLEME & SIFIRLAMA (SADECE SÜPER ADMİN)
    const exportBackupBtn = document.getElementById('exportBackupBtn');
    if (exportBackupBtn) {
        exportBackupBtn.addEventListener('click', async () => {
            const data = await getData();
            const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
            const dlAnchor = document.createElement('a');
            dlAnchor.setAttribute("href", str);
            dlAnchor.setAttribute("download", `sdu_kitap_toplulugu_yedek_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            dlAnchor.remove();
            showToast('📁 Veri yedeği JSON dosyası olarak indirildi!', 'fas fa-file-download');
        });
    }

    const importBackupInput = document.getElementById('importBackupInput');
    if (importBackupInput) {
        importBackupInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (imported.book && imported.events) {
                        await saveData(imported);
                        await renderAllSections();
                        showToast('✅ Veriler yedek dosyasından başarıyla yüklendi!', 'fas fa-check-double');
                    } else {
                        alert('Geçersiz yedek dosyası formatı!');
                    }
                } catch (err) {
                    alert('Dosya okunurken bir hata oluştu: ' + err.message);
                }
            };
            reader.readAsText(file);
        });
    }

    const resetDataBtn = document.getElementById('resetDataBtn');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', async () => {
            if (!confirm('DİKKAT: Tüm veriler varsayılan haline döndürülecektir. Devam etmek istiyor musunuz?')) return;
            await saveData(DEFAULT_DATA);
            await renderAllSections();
            showToast('Sistem varsayılan verilere sıfırlandı.', 'fas fa-redo');
        });
    }

    // ==========================================
    // 9. GELİŞTİRİCİYE / SÜPER ADMİNE YAZILAN MESAJLAR
    // ==========================================
    function renderDevMessagesSection(data) {
        const tbody = document.getElementById('devMessagesTableBody');
        const countEl = document.getElementById('devMsgCount');
        if (!tbody) return;
        tbody.innerHTML = '';
        const list = data.developer_messages || [];
        if (countEl) countEl.textContent = list.length;

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">Henüz ekip üyelerinden bir not bırakılmadı.</td></tr>`;
            return;
        }

        list.forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${m.sender}</strong></td>
                <td><span class="table-tag tag-kitap">${m.category}</span></td>
                <td>${m.content}</td>
                <td><small>${m.date}</small></td>
                <td>
                    <button class="btn-icon-action delete" title="Mesajı Sil" onclick="deleteDevMessage(${m.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.deleteDevMessage = async function(id) {
        if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;
        const data = await getData();
        data.developer_messages = (data.developer_messages || []).filter(m => m.id !== id);
        await saveData(data);
        renderDevMessagesSection(data);
        await renderOverview(data);
        showToast('Not silindi.', 'fas fa-trash-alt');
    };

    // FAB & Modal Dinleyicileri
    const devMsgFab = document.getElementById('devMsgFab');
    const devMsgModal = document.getElementById('devMsgModal');
    const closeDevMsgModal = document.getElementById('closeDevMsgModal');
    const devMsgModalOverlay = document.getElementById('devMsgModalOverlay');
    const devMsgForm = document.getElementById('devMsgForm');
    const devSenderName = document.getElementById('devSenderName');
    const devMsgWhatsAppBtn = document.getElementById('devMsgWhatsAppBtn');

    if (devMsgFab && devMsgModal) {
        devMsgFab.addEventListener('click', () => {
            devMsgModal.style.display = 'flex';
            const user = getLoggedInUser();
            if (user && devSenderName && !devSenderName.value) {
                devSenderName.value = `${user.name} (${user.title || user.role})`;
            }
        });
    }

    if (closeDevMsgModal && devMsgModal) {
        closeDevMsgModal.addEventListener('click', () => {
            devMsgModal.style.display = 'none';
        });
    }

    if (devMsgModalOverlay && devMsgModal) {
        devMsgModalOverlay.addEventListener('click', () => {
            devMsgModal.style.display = 'none';
        });
    }

    if (devMsgForm) {
        devMsgForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const sender = document.getElementById('devSenderName').value.trim();
            const category = document.getElementById('devMsgCategory').value;
            const content = document.getElementById('devMsgContent').value.trim();

            const data = await getData();
            if (!data.developer_messages) data.developer_messages = [];
            data.developer_messages.unshift({
                id: Date.now(),
                sender,
                category,
                content,
                date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            });
            await saveData(data);
            renderDevMessagesSection(data);
            await renderOverview(data);

            devMsgModal.style.display = 'none';
            devMsgForm.reset();
            showToast('✉️ Notunuz Süper Admin masasına iletildi!', 'fas fa-check-circle');
        });
    }

    if (devMsgWhatsAppBtn) {
        devMsgWhatsAppBtn.addEventListener('click', () => {
            const sender = document.getElementById('devSenderName')?.value.trim() || 'Yönetim Üyesi';
            const category = document.getElementById('devMsgCategory')?.value || 'Not';
            const content = document.getElementById('devMsgContent')?.value.trim() || '';

            const waText = `Merhaba İlker Başkanım! 👋%0A%0A*Gönderen:* ${encodeURIComponent(sender)}%0A*Konu:* ${encodeURIComponent(category)}%0A*Mesaj:* ${encodeURIComponent(content || 'Panel üzerinden bir not iletmek istiyorum.')}`;
            const url = `https://wa.me/905XXXXXXXXX?text=${waText}`;
            window.open(url, '_blank');
        });
    }

    // Gerçek Zamanlı Sekmeler Arası Senkronizasyon Dinleyicisi
    window.addEventListener('storage', (e) => {
        if (e.key === 'sdu_topluluk_data' || e.key === 'sdu_submitted_applications') {
            renderAllSections();
            showToast('🔔 Yeni başvuru veya veri senkronize edildi!', 'fas fa-bell');
        }
    });

    // ==========================================
    // 10. GALERİ YÖNETİMİ
    // ==========================================
    const btnUploadImage = document.getElementById('btnUploadImage');
    const galleryFileInput = document.getElementById('galleryFileInput');
    
    if (btnUploadImage && galleryFileInput) {
        btnUploadImage.addEventListener('click', () => {
            galleryFileInput.click();
        });
        
        galleryFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Sadece resimler
            if (!file.type.startsWith('image/')) {
                alert('Lütfen geçerli bir resim dosyası seçin.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = async (event) => {
                const img = new Image();
                img.onload = async () => {
                    // Resmi sıkıştır (maksimum boyut ~800px)
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 800;
                    
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const base64Str = canvas.toDataURL('image/jpeg', 0.7); // 70% quality JPEG
                    
                    const data = await getData();
                    if (!data.gallery) data.gallery = [];
                    
                    const title = prompt("Fotoğraf için kısa bir açıklama/başlık girin:") || "Etkinlik Fotoğrafı";
                    
                    data.gallery.push({
                        id: Date.now(),
                        src: base64Str,
                        title: title,
                        date: new Date().toLocaleDateString('tr-TR')
                    });
                    
                    await saveData(data);
                    renderGallerySection(data);
                    showToast('📸 Fotoğraf galeriye eklendi!', 'fas fa-camera');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
            galleryFileInput.value = '';
        });
    }
    
    function renderGallerySection(data) {
        const grid = document.getElementById('adminGalleryGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        const gallery = data.gallery || [];
        
        if (gallery.length === 0) {
            grid.innerHTML = `
                <div style="text-align: center; padding: 40px; background: var(--bg-surface-alt); border-radius: 8px; border: 2px dashed var(--border-color); grid-column: 1 / -1; color: var(--text-muted);">
                    <i class="fas fa-image" style="font-size: 3rem; margin-bottom: 12px; opacity: 0.5;"></i>
                    <p>Henüz galeriye fotoğraf yüklenmedi.</p>
                </div>
            `;
            return;
        }
        
        gallery.forEach(item => {
            const div = document.createElement('div');
            div.style.position = 'relative';
            div.style.borderRadius = '8px';
            div.style.overflow = 'hidden';
            div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            div.style.backgroundColor = 'var(--bg-surface)';
            div.style.border = '1px solid var(--border-color)';
            
            div.innerHTML = `
                <img src="${item.src}" alt="${item.title}" style="width: 100%; height: 160px; object-fit: cover; display: block;" />
                <div style="padding: 12px;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">${item.date}</div>
                    <button class="btn-primary" style="width: 100%; background: #ef4444; padding: 8px; font-size: 13px;" onclick="deleteGalleryImage(${item.id})"><i class="fas fa-trash-alt"></i> Sil</button>
                </div>
            `;
            grid.appendChild(div);
        });
    }
    
    window.deleteGalleryImage = async function(id) {
        if (!confirm('Bu fotoğrafı galeriden silmek istediğinize emin misiniz?')) return;
        const data = await getData();
        data.gallery = (data.gallery || []).filter(img => img.id !== id);
        await saveData(data);
        renderGallerySection(data);
        showToast('Fotoğraf galeriden silindi.', 'fas fa-trash-alt');
    };

    // ==========================================
    // İLK YÜKLEME KONTROLÜ
    // ==========================================
    (async function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            authScreen.style.display = 'flex';
            const authModal = document.querySelector('.auth-modal');
            const tokenSpinner = document.createElement('div');
            tokenSpinner.id = 'tokenSpinner';
            tokenSpinner.style.textAlign = 'center';
            tokenSpinner.style.padding = '40px';
            tokenSpinner.innerHTML = '<i class="fas fa-spinner fa-spin fa-3x" style="color:var(--primary);"></i><p style="margin-top:16px;">Özel giriş bağlantısı kontrol ediliyor...</p>';
            if (authModal) authModal.style.display = 'none';
            authScreen.appendChild(tokenSpinner);
            
            try {
                const apps = await getApplications();
                const app = apps.find(a => a.id === token);
                
                if (app && app.status === 'Onaylandı') {
                    const magicUser = {
                        id: app.id,
                        name: app.fullName,
                        email: app.phone || 'Girilmedi',
                        role: 'member',
                        title: 'Topluluk Üyesi',
                        isMaster: false
                    };
                    setLoggedInUser(magicUser);
                    window.history.replaceState({}, document.title, window.location.pathname);
                    tokenSpinner.remove();
                    if (authModal) authModal.style.display = '';
                    initAdminDashboard(magicUser);
                    showToast('Özel link ile başarıyla giriş yapıldı!', 'fas fa-check-circle');
                    return;
                } else {
                    tokenSpinner.remove();
                    if (authModal) authModal.style.display = '';
                    alert('Bu giriş bağlantısı geçersiz veya henüz yönetici tarafından onaylanmamış.');
                    window.location.href = window.location.pathname;
                    return;
                }
            } catch (e) {
                tokenSpinner.remove();
                if (authModal) authModal.style.display = '';
                console.error('Magic link error:', e);
                window.location.href = window.location.pathname;
                return;
            }
        }
        
        const loggedUser = getLoggedInUser();
        if (loggedUser) {
            let isValid = true;
            if (loggedUser.email !== "ilkerm946@gmail.com") {
                try {
                    isValid = await verifyAdmin(loggedUser.id);
                } catch(e) { console.error("Admin doğrulama hatası:", e); }
            }
            if (isValid) {
                initAdminDashboard(loggedUser);
            } else {
                setLoggedInUser(null);
                authScreen.style.display = 'flex';
                adminApp.style.display = 'none';
                showToast("Güvenlik: Hesabınız askıya alınmış veya silinmiş. Lütfen tekrar giriş yapın.", "fas fa-exclamation-triangle");
            }
        } else {
            authScreen.style.display = 'flex';
            adminApp.style.display = 'none';
        }
    })();

})();
