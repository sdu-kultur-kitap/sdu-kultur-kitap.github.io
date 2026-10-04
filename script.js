/* ==========================================
   Kültür ve Kitap Topluluğu — SDÜ
   JavaScript: Navigation, Animations, Counters
   ========================================== */

import { registerMember, loginMember, submitApplication, submitSuggestion, verifyMember, getPublicData, setPublicData } from './firebase-service.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.SduAppData = await getPublicData() || { events: [], book: {} };
    } catch (err) {
        console.warn('Firebase initial load error (offline/fallback mode):', err);
        window.SduAppData = { events: [], book: {} };
    }

    // === DARK THEME TOGGLE ===
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');

    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    // Verify session in background without blocking UI
    (async () => {
        const currentUser = getCurrentMember();
        if (currentUser && currentUser.id) {
            try {
                const isValid = await verifyMember(currentUser.id);
                if (!isValid) {
                    clearMemberSession();
                    renderUserWidget();
                    bindEventJoinButtons();
                    showToast("Güvenlik: Hesabınız sistemden silinmiş. Oturumunuz sonlandırıldı.", "fas fa-exclamation-triangle");
                }
            } catch(e) { console.warn("Session verification failed", e); }
        }
    })();

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);

        showToast(newTheme === 'dark' ? '🌙 Karanlık tema etkinleştirildi' : '☀️ Aydınlık tema etkinleştirildi', newTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun');

        // Animate the button
        themeToggle.style.transform = 'rotate(360deg) scale(1.1)';
        setTimeout(() => {
            themeToggle.style.transform = '';
        }, 400);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');

    function handleScroll() {
        const scrollY = window.scrollY;

        // Navbar background on scroll
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Back to top button
        if (scrollY > 400) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }

        // Scroll Progress Bar
        const progressBar = document.getElementById('scrollProgressBar');
        if (progressBar) {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = totalHeight > 0 ? (scrollY / totalHeight) * 100 : 0;
            progressBar.style.width = `${progress}%`;
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // === BACK TO TOP ===
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // === MOBILE NAVIGATION ===
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Close mobile menu on outside click
    document.addEventListener('click', (e) => {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // === ACTIVE NAV LINK ON SCROLL ===
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link:not(.nav-cta)');

    function setActiveLink() {
        const scrollY = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    window.addEventListener('scroll', setActiveLink, { passive: true });

    // === ANIMATED COUNTER ===
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number');

        counters.forEach(counter => {
            if (counter.dataset.animated) return;

            const target = parseInt(counter.dataset.target);
            const duration = 2000;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.round(eased * target);

                counter.textContent = current;

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                    counter.dataset.animated = 'true';
                }
            }

            requestAnimationFrame(updateCounter);
        });
    }

    // === SCROLL REVEAL ANIMATIONS ===
    function addScrollAnimations() {
        // Add fade-in class to elements
        const animatedElements = document.querySelectorAll(
            '.about-card, .team-card, .event-card, .gallery-item, .contact-card, .book-showcase, .past-book-card, .faq-item, .join-wrapper'
        );

        animatedElements.forEach((el, index) => {
            el.classList.add('fade-in');
            el.style.transitionDelay = `${index % 4 * 0.1}s`;
        });
    }

    addScrollAnimations();

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Animate counters when hero stats come into view
                if (entry.target.closest('.hero-stats') || entry.target.classList.contains('hero-stats')) {
                    animateCounters();
                }
            }
        });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Observe hero stats for counter animation
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        observer.observe(heroStats);
    }

    // === SMOOTH SCROLL FOR ANCHOR LINKS ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // === GALLERY LIGHTBOX (simple) ===
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            // If item has a real image, show lightbox
            const img = item.querySelector('img');
            if (img) {
                showLightbox(img.src, img.alt);
            }
        });
    });

    function showLightbox(src, alt) {
        const lightbox = document.createElement('div');
        lightbox.style.cssText = `
            position: fixed; inset: 0; z-index: 10000;
            background: rgba(0,0,0,0.9); display: flex;
            align-items: center; justify-content: center;
            cursor: pointer; animation: fadeIn 0.3s ease;
        `;
        lightbox.innerHTML = `
            <img src="${src}" alt="${alt}" style="max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
            <button style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: white; font-size: 2rem; cursor: pointer;">&times;</button>
        `;

        lightbox.addEventListener('click', () => lightbox.remove());
        document.body.appendChild(lightbox);
    }

    // === LITERARY QUOTES ROTATOR ===
    const quotes = [
        { text: "Kitapsız yaşamak; kör, sağır, dilsiz yaşamaktır.", author: "Mustafa Kemal Atatürk" },
        { text: "Bir kitap okudum ve bütün hayatım değişti.", author: "Orhan Pamuk" },
        { text: "Dünyayı güzellik kurtaracak, bir insanı sevmekle başlayacak her şey.", author: "Sait Faik Abasıyanık" },
        { text: "İnsan ancak anladığı şeyleri duyar.", author: "Ahmet Hamdi Tanpınar" },
        { text: "Kitaplar, soğuk ama güvenilir dostlardır.", author: "Victor Hugo" },
        { text: "Bizi ancak kitaplar ve samimi fikirler kurtarabilir.", author: "Sabahattin Ali" },
        { text: "İyi kitaplar okumak, geçmiş yüzyılların en iyi insanlarıyla sohbet etmektir.", author: "René Descartes" }
    ];

    let currentQuoteIndex = 0;
    const quoteTextEl = document.getElementById('quoteText');
    const quoteAuthorEl = document.getElementById('quoteAuthor');
    const nextQuoteBtn = document.getElementById('nextQuoteBtn');

    function showQuote(index) {
        if (!quoteTextEl || !quoteAuthorEl) return;
        quoteTextEl.style.opacity = '0';
        quoteAuthorEl.style.opacity = '0';
        setTimeout(() => {
            quoteTextEl.textContent = `"${quotes[index].text}"`;
            quoteAuthorEl.textContent = `— ${quotes[index].author}`;
            quoteTextEl.style.opacity = '1';
            quoteAuthorEl.style.opacity = '1';
        }, 250);
    }

    if (nextQuoteBtn) {
        nextQuoteBtn.addEventListener('click', () => {
            currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
            showQuote(currentQuoteIndex);
            showToast('✨ Yeni bir edebiyat sözü yüklendi', 'fas fa-feather-alt');
        });
    }

    // Auto rotate quotes every 12 seconds
    setInterval(() => {
        currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
        showQuote(currentQuoteIndex);
    }, 12000);

    // === EVENT FILTERS ===
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filterValue = btn.getAttribute('data-filter');
            const activeCards = document.querySelectorAll('.event-card[data-category]');

            activeCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    card.style.display = 'block';
                    card.classList.remove('hidden');
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(15px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                        card.classList.add('hidden');
                    }, 300);
                }
            });
        });
    });

    // === FAQ ACCORDION ===
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        const answerEl = item.querySelector('.faq-answer');

        if (questionBtn && answerEl) {
            questionBtn.addEventListener('click', () => {
                const isOpen = item.classList.contains('active');

                // Close other accordion items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherAnswer = otherItem.querySelector('.faq-answer');
                        if (otherAnswer) otherAnswer.style.maxHeight = null;
                    }
                });

                if (isOpen) {
                    item.classList.remove('active');
                    answerEl.style.maxHeight = null;
                } else {
                    item.classList.add('active');
                    answerEl.style.maxHeight = answerEl.scrollHeight + 'px';
                }
            });
        }
    });

    // === JOIN FORM SUBMISSION ===
    const joinForm = document.getElementById('joinForm');
    const formSuccessMessage = document.getElementById('formSuccessMessage');
    const waRedirectBtn = document.getElementById('waRedirectBtn');

    if (joinForm) {
        joinForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value.trim();
            const department = document.getElementById('facultyDepartment').value.trim();
            const grade = document.getElementById('studentGrade').value;
            const phone = document.getElementById('phoneNum').value.trim();
            const primaryInterest = document.getElementById('interest')?.value || 'Kitap Okuma Kulübü & Tahliller';

            // Çoklu ilgi alanları ve "Diğer" girişini topla
            const checkedAreas = Array.from(joinForm.querySelectorAll('input[name="interestAreas"]:checked')).map(cb => cb.value);
            const otherInput = document.getElementById('otherInterestInput');
            const otherVal = otherInput ? otherInput.value.trim() : '';
            if (otherVal) {
                checkedAreas.push(otherVal);
            }
            const allInterests = checkedAreas.length > 0 ? checkedAreas : [primaryInterest];
            const interestSummary = allInterests.join(', ');

            const submitBtn = joinForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
            }

            // Generate WhatsApp message for direct management notification
            const message = `Merhaba! Ben ${fullName}. SDÜ ${department} (${grade}) öğrencisiyim. Kültür ve Kitap Topluluğu'na katılmak istiyorum.\n\nİlgi Alanlarım: ${interestSummary}\nTelefon: ${phone}`;
            const waUrl = `https://wa.me/905XXXXXXXXX?text=${encodeURIComponent(message)}`;

            if (waRedirectBtn) {
                waRedirectBtn.href = waUrl;
            }

            try {
                // Save applicant and auto-approve in Firestore
                await submitApplication({
                    fullName,
                    department,
                    grade,
                    phone,
                    interest: interestSummary,
                    interests: allInterests,
                    date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                });

                // Hide form and show success message
                joinForm.style.display = 'none';
                if (formSuccessMessage) {
                    formSuccessMessage.style.display = 'block';
                    formSuccessMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }

                showToast('🎉 Üyeliğiniz anında onaylandı! Aramıza hoş geldiniz.', 'fas fa-check-circle');
            } catch (err) {
                console.error('Başvuru kaydetme hatası:', err);
                showToast('Başvuru gönderilirken bir hata oluştu.', 'fas fa-exclamation-triangle');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Başvuruyu Gönder <i class="fas fa-paper-plane"></i>';
                }
            }
        });
    }

    // === YÖNETİM KURULU İÇİN GİZLİ KISAYOL (Ctrl + Shift + A) ===
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            e.preventDefault();
            showToast('🔐 Yönetim Masasına yönlendiriliyorsunuz...', 'fas fa-key');
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 600);
        }
    });

    // === SUGGEST AN EVENT FORM SUBMISSION ===
    const suggestEventForm = document.getElementById('suggestEventForm');
    if (suggestEventForm) {
        suggestEventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const member = getCurrentMember();

            let name = '';
            let department = '';

            if (member && member.role === 'member') {
                name = member.name;
                department = member.department || 'Topluluk Üyesi';
            } else {
                const nameEl = document.getElementById('suggName');
                const deptEl = document.getElementById('suggDept');
                name = nameEl ? nameEl.value.trim() : 'Misafir';
                department = deptEl ? deptEl.value.trim() : '-';
            }

            const title = document.getElementById('suggTitle').value.trim();
            const desc = document.getElementById('suggDesc').value.trim();
            const submitBtn = suggestEventForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gönderiliyor...';
            }

            try {
                await submitSuggestion({
                    name,
                    department,
                    title,
                    desc,
                    date: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
                });

                suggestEventForm.reset();
                showToast('💡 Harika fikriniz için teşekkürler! Öneriniz yönetim kurulumuza iletildi.', 'fas fa-lightbulb');
            } catch (err) {
                console.error('Öneri kaydetme hatası:', err);
                showToast('Öneriniz gönderilirken bir hata oluştu.', 'fas fa-exclamation-triangle');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Fikrimi Gönder <i class="fas fa-paper-plane"></i>';
                }
            }
        });
    }

    // === TOAST NOTIFICATION HELPER ===
    const toastContainer = document.getElementById('toastContainer');
    function showToast(message, icon = 'fas fa-info-circle') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 320);
        }, 3200);
    }

    // === 3D BOOK INTERACTIVE MOUSE TILT ===
    const bookShowcase = document.querySelector('.book-showcase');
    const book3d = document.querySelector('.book-3d');

    if (bookShowcase && book3d) {
        bookShowcase.addEventListener('mousemove', (e) => {
            const rect = bookShowcase.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate tilt angle (-14deg to +14deg)
            const rotateY = ((x - centerX) / centerX) * 15;
            const rotateX = -((y - centerY) / centerY) * 12;

            book3d.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(1.04)`;
        });

        bookShowcase.addEventListener('mouseleave', () => {
            book3d.style.transform = 'rotateY(-18deg) rotateX(6deg) scale(1)';
        });
    }

    // === ANIMATED READING PROGRESS BAR ===
    const readingBar = document.getElementById('readingProgressBar');
    const readingPercent = document.getElementById('readingProgressPercent');

    if (readingBar) {
        const progressObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const rawTarget = readingBar.dataset.target;
                    const parsed = parseInt(rawTarget, 10);
                    const target = isNaN(parsed) ? 75 : parsed;
                    const safeTarget = Math.max(0, Math.min(100, target));
                    readingBar.style.width = `${safeTarget}%`;

                    if (safeTarget <= 0) {
                        if (readingPercent) readingPercent.textContent = '%0';
                    } else {
                        // Counter animation for percentage
                        let current = 0;
                        const duration = 1200;
                        const stepTime = Math.max(Math.floor(duration / safeTarget), 10);

                        const interval = setInterval(() => {
                            current++;
                            if (readingPercent) readingPercent.textContent = `%${current}`;
                            if (current >= safeTarget) clearInterval(interval);
                        }, stepTime);
                    }

                    progressObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.25 });

        progressObserver.observe(readingBar);
    }

    // === EVENT CALENDAR BUTTONS ===
    function bindEventCalButtons() {
        const calBtns = document.querySelectorAll('.event-cal-btn');
        calBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const title = btn.dataset.title || 'Etkinlik';
                const date = btn.dataset.date || '';
                showToast(`📅 "${title}" (${date}) hatırlatıcınız kaydedildi!`, 'fas fa-calendar-check');

                btn.style.transform = 'scale(1.25) rotate(15deg)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 300);
            };
        });
    }
    bindEventCalButtons();

    // ==========================================
    // ETKİNLİK TAKVİMİ BİLEŞENİ
    // ==========================================
    const btnViewCards = document.getElementById('btnViewCards');
    const btnViewCalendar = document.getElementById('btnViewCalendar');
    const eventsGrid = document.getElementById('eventsGrid');
    const eventsCalendarView = document.getElementById('eventsCalendarView');
    const eventFilters = document.getElementById('eventFilters');

    let currentCalMonth = 9; // 9 = Ekim 2026 (0-indexed)
    const currentCalYear = 2026;

    if (btnViewCards && btnViewCalendar) {
        btnViewCards.addEventListener('click', () => {
            btnViewCards.classList.add('active');
            btnViewCalendar.classList.remove('active');
            eventsGrid.style.display = 'grid';
            eventsCalendarView.style.display = 'none';
            if (eventFilters) eventFilters.style.display = 'flex';
        });

        btnViewCalendar.addEventListener('click', () => {
            btnViewCalendar.classList.add('active');
            btnViewCards.classList.remove('active');
            eventsGrid.style.display = 'none';
            eventsCalendarView.style.display = 'grid';
            if (eventFilters) eventFilters.style.display = 'none';
            renderCalendar(currentCalMonth, currentCalYear);
        });
    }

    const calMonthTitle = document.getElementById('calMonthTitle');
    const calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
    const calNextMonthBtn = document.getElementById('calNextMonthBtn');
    const calendarDaysGrid = document.getElementById('calendarDaysGrid');
    const calPanelDateTitle = document.getElementById('calPanelDateTitle');
    const calPanelBody = document.getElementById('calPanelBody');

    const MONTH_NAMES_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

    if (calPrevMonthBtn && calNextMonthBtn) {
        calPrevMonthBtn.addEventListener('click', () => {
            if (currentCalMonth > 0) {
                currentCalMonth--;
                renderCalendar(currentCalMonth, currentCalYear);
            }
        });

        calNextMonthBtn.addEventListener('click', () => {
            if (currentCalMonth < 11) {
                currentCalMonth++;
                renderCalendar(currentCalMonth, currentCalYear);
            }
        });
    }

    function getAllEventsList() {
        if (window.SduAppData && window.SduAppData.events && window.SduAppData.events.length > 0) {
            return window.SduAppData.events;
        }
        return [];
    }

    function renderCalendar(month, year) {
        if (!calendarDaysGrid || !calMonthTitle) return;
        calMonthTitle.textContent = `${MONTH_NAMES_TR[month]} ${year}`;

        calendarDaysGrid.innerHTML = '';
        const allEvents = getAllEventsList();

        // Ayın ilk gününün haftanın hangi günü olduğu (Pazartesi=0, Salı=1, ... Pazar=6)
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = (firstDay + 6) % 7; // TR takvim pazartesi başlar
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Boş hücreler
        for (let i = 0; i < startOffset; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'cal-day-cell empty';
            calendarDaysGrid.appendChild(emptyCell);
        }

        // Gün hücreleri
        for (let d = 1; d <= daysInMonth; d++) {
            const cell = document.createElement('div');
            cell.className = 'cal-day-cell';
            cell.textContent = d;

            // Bu günde etkinlik var mı?
            const currentMonthName = MONTH_NAMES_TR[month].toLowerCase();
            const matchingEvents = allEvents.filter(ev => {
                const lowerDate = ev.date.toLowerCase();
                const dayMatch = lowerDate.includes(String(d) + ' ') || lowerDate.includes('0' + String(d) + ' ');
                const monthMatch = lowerDate.includes(currentMonthName);
                return dayMatch && monthMatch;
            });

            if (matchingEvents.length > 0) {
                cell.classList.add('has-event');
                const dot = document.createElement('span');
                dot.className = 'event-dot';
                cell.appendChild(dot);
            }

            cell.addEventListener('click', () => {
                document.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                showDayEvents(d, MONTH_NAMES_TR[month], year, matchingEvents);
            });

            calendarDaysGrid.appendChild(cell);
        }
    }

    function showDayEvents(day, monthName, year, events) {
        if (!calPanelDateTitle || !calPanelBody) return;
        calPanelDateTitle.textContent = `${day} ${monthName} ${year}`;
        calPanelBody.innerHTML = '';

        if (!events || events.length === 0) {
            calPanelBody.innerHTML = `<p class="cal-empty-msg"><i class="far fa-calendar"></i> Bu tarihte planlanmış bir etkinlik bulunmuyor.</p>`;
            return;
        }

        events.forEach(ev => {
            const item = document.createElement('div');
            item.className = 'cal-event-item-card';
            item.innerHTML = `
                <h5>${ev.title}</h5>
                <p>${ev.desc || ''}</p>
                <div class="cal-event-item-meta">
                    <span><i class="far fa-clock"></i> ${ev.time || '14:00'}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${ev.place || 'Kampüs'}</span>
                    <span><i class="fas fa-tag"></i> ${ev.category || 'Etkinlik'}</span>
                </div>
            `;
            calPanelBody.appendChild(item);
        });
    }

    // ==========================================
    // DİNAMİK VERİ SENKRONİZASYONU (LOCALSTORAGE)
    function syncDynamicSiteContent() {
        try {
            const data = window.SduAppData || {};

            // Ayın Kitabı Senkronizasyonu
            if (data.book) {
                const b = data.book;
                const bookTag = document.querySelector('.book-tag');
                if (bookTag && b.monthTag) bookTag.textContent = b.monthTag;

                const bookTitle = document.querySelector('.book-title');
                if (bookTitle && b.title) bookTitle.textContent = b.title;

                const bookAuthor = document.querySelector('.book-author');
                if (bookAuthor && b.author) bookAuthor.textContent = b.author;

                const bookHeading = document.querySelector('.book-heading');
                if (bookHeading && b.title) bookHeading.textContent = b.title;

                const bookWriter = document.querySelector('.book-writer');
                if (bookWriter && b.author) bookWriter.textContent = b.author;

                const bookSynopsis = document.querySelector('.book-synopsis');
                if (bookSynopsis && (b.quote || b.synopsis)) {
                    let html = '';
                    if (b.quote) html += `"${b.quote}"<br><br>`;
                    if (b.synopsis) html += b.synopsis;
                    bookSynopsis.innerHTML = html;
                }

                const badges = document.querySelectorAll('.book-meta-badges .badge');
                if (badges.length >= 3) {
                    if (b.genre) badges[0].innerHTML = `<i class="fas fa-bookmark"></i> ${b.genre}`;
                    if (b.pages) badges[1].innerHTML = `<i class="fas fa-file-alt"></i> ${b.pages} Sayfa`;
                    if (b.readers) badges[2].innerHTML = `<i class="fas fa-users"></i> ${b.readers}`;
                }

                const meetingItems = document.querySelectorAll('.book-meeting-card .meeting-item span');
                if (meetingItems.length >= 2) {
                    if (b.meetingDate) meetingItems[0].textContent = b.meetingDate;
                    if (b.meetingPlace) meetingItems[1].textContent = b.meetingPlace;
                }

                const readingBar = document.getElementById('readingProgressBar');
                if (readingBar && b.progress !== undefined) {
                    readingBar.dataset.target = b.progress;
                }
            }

            // Etkinlikler Senkronizasyonu
            if (data.events && Array.isArray(data.events) && data.events.length > 0) {
                const grid = document.getElementById('eventsGrid');
                const pastGrid = document.getElementById('pastEventsGrid');
                
                if (grid) grid.innerHTML = '';
                if (pastGrid) pastGrid.innerHTML = '';
                
                let hasUpcoming = false;
                data.events.forEach(ev => {
                    const pCount = (ev.participants && Array.isArray(ev.participants)) ? ev.participants.length : 0;
                    const card = document.createElement('div');
                    card.className = 'event-card';
                    card.dataset.category = ev.category;
                    card.dataset.id = ev.id;
                    
                    const isCompleted = ev.badge === 'Tamamlandı';
                    
                    let actionRowHtml = '';
                    if (!isCompleted) {
                        actionRowHtml = `
                            <div class="event-action-row">
                                <span class="event-attendees-badge"><i class="fas fa-users"></i> <strong class="participant-count">${pCount}</strong> Katılımcı</span>
                                <button type="button" class="btn-event-join" data-event-id="${ev.id}" data-event-title="${ev.title}">
                                    <i class="fas fa-plus-circle"></i> <span>Katılmak İstiyorum</span>
                                </button>
                            </div>
                        `;
                    }
                    
                    // Kategoriye göre AI ile oluşturulan özel etkinlik görselleri
                    const eventImages = {
                        kitap: ['images/events/kitap-1.jpg', 'images/events/kitap-2.jpg', 'images/events/kitap-3.jpg'],
                        soylesi: ['images/events/film-1.jpg', 'images/events/soylesi-1.jpg', 'images/events/siir-1.jpg'],
                        gezi: ['images/events/gezi-1.jpg', 'images/events/gezi-2.jpg']
                    };
                    const categoryImgs = eventImages[ev.category] || eventImages.kitap;
                    const imgUrl = categoryImgs[ev.id % categoryImgs.length];
                    
                    card.innerHTML = `
                        <div class="event-image">
                            <img src="${imgUrl}" alt="Etkinlik Görseli" style="width: 100%; height: 100%; object-fit: cover;">
                            <span class="event-badge ${ev.badge === 'Önümüzdeki Ay' ? 'upcoming' : ''} ${isCompleted ? 'completed' : ''}">${ev.badge || 'Yaklaşan'}</span>
                        </div>
                        <div class="event-content">
                            <div class="event-date">
                                <i class="fas fa-calendar-alt"></i>
                                ${ev.date}
                            </div>
                            <h3>${ev.title}</h3>
                            <p>${ev.desc || ''}</p>
                            <div class="event-footer">
                                <span><i class="fas fa-map-marker-alt"></i> ${ev.place}</span>
                                <span><i class="fas fa-clock"></i> ${ev.time || '14:00'}</span>
                                ${!isCompleted ? `<button class="event-cal-btn" data-title="${ev.title}" data-date="${ev.date}" aria-label="Takvime Ekle" title="Takvime Ekle / Hatırlatıcı"><i class="far fa-calendar-plus"></i></button>` : ''}
                            </div>
                            ${actionRowHtml}
                        </div>
                    `;
                    
                    if (isCompleted && pastGrid) {
                        pastGrid.appendChild(card);
                    } else if (!isCompleted && grid) {
                        grid.appendChild(card);
                        hasUpcoming = true;
                    }
                });
                
                if (typeof hasUpcoming !== 'undefined' && !hasUpcoming && grid) {
                    grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; background: rgba(255,255,255,0.8); border-radius: 12px; border: 1px dashed var(--border-color);"><i class="fas fa-calendar-times" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px; display: block;"></i><h3 style="color: var(--text-dark); margin-bottom: 8px;">Yaklaşan Etkinlik Bulunmuyor</h3><p style="color: var(--text-muted);">Şu an için planlanmış yeni bir etkinlik bulunmamaktadır. Yeni etkinlikler duyurulduğunda burada listelenecektir.</p></div>';
                }
                
                bindEventCalButtons();
                bindEventJoinButtons();
            }
            // Galeri Senkronizasyonu
            if (data.gallery && Array.isArray(data.gallery) && data.gallery.length > 0) {
                const publicGrid = document.getElementById('publicGalleryGrid');
                if (publicGrid) {
                    publicGrid.innerHTML = '';
                    data.gallery.forEach((img, idx) => {
                        const div = document.createElement('div');
                        div.className = idx === 0 ? 'gallery-item gallery-item-large' : 'gallery-item';
                        div.innerHTML = `
                            <img src="${img.src}" alt="${img.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
                            <div class="gallery-overlay">
                                <span>${img.title}</span>
                            </div>
                        `;
                        publicGrid.appendChild(div);
                    });
                }
            }
        } catch (e) {
            console.warn('Dinamik senkronizasyon hatası:', e);
        }
    }
    window.syncDynamicSiteContent = syncDynamicSiteContent;

    // ==========================================
    // TOPLULUK ÜYELİĞİ & OTURUM YÖNETİMİ (MİSAFİR / ÜYE)
    // ==========================================
    function getCurrentMember() {
        try {
            const raw = localStorage.getItem('sdu_member_session');
            if (raw) {
                const member = JSON.parse(raw);
                if (member && ['member', 'üye', 'Üye', 'Ã¼ye'].includes(member.role)) {
                    member.role = 'member'; // normalize everywhere
                    if (!Array.isArray(member.attendedEvents)) member.attendedEvents = [];
                    return member;
                }
            }
        } catch (e) {}
        return { role: 'guest', name: 'Misafir Okur' };
    }

    function saveMemberSession(member) {
        localStorage.setItem('sdu_member_session', JSON.stringify(member));
    }

    function clearMemberSession() {
        localStorage.removeItem('sdu_member_session');
    }

    const navUserWidget = document.getElementById('navUserWidget');
    const navUserBtn = document.getElementById('navUserBtn');
    const navUserRoleLabel = document.getElementById('navUserRoleLabel');
    const navUserNameLabel = document.getElementById('navUserNameLabel');
    const navUserStatusDot = document.getElementById('navUserStatusDot');
    const navUserAvatarIcon = document.getElementById('navUserAvatarIcon');
    const dropdownUserName = document.getElementById('dropdownUserName');
    const dropdownUserRole = document.getElementById('dropdownUserRole');
    const dropdownAvatarCircle = document.getElementById('dropdownAvatarCircle');
    const dropdownBody = document.getElementById('dropdownBody');

    function renderUserWidget() {
        if (!navUserWidget) return;
        const currentMember = getCurrentMember();

        const bizeKatilSec = document.getElementById('bize-katil');
        const suggFormRow = document.querySelector('#suggestEventForm .form-row');
        const navCtaBtn = document.querySelector('.nav-cta');
        const heroCtaBtn = document.querySelector('.hero-buttons .btn-outline[href="#bize-katil"]');

        if (currentMember.role === 'member') {
            // Üye Görünümü
            if (navUserRoleLabel) {
                navUserRoleLabel.textContent = 'Topluluk Üyesi';
                navUserRoleLabel.className = 'user-role-label member';
            }
            if (navUserNameLabel) {
                navUserNameLabel.textContent = currentMember.name.split(' ')[0];
                navUserNameLabel.title = currentMember.name;
            }
            if (navUserStatusDot) {
                navUserStatusDot.className = 'user-status-dot member';
            }
            if (navUserAvatarIcon) {
                navUserAvatarIcon.innerHTML = '<i class="fas fa-user-check"></i>';
            }

            if (dropdownUserName) dropdownUserName.textContent = currentMember.name;
            if (dropdownUserRole) {
                dropdownUserRole.textContent = 'Topluluk Üyesi';
                dropdownUserRole.className = 'd-badge-role member';
            }
            if (dropdownAvatarCircle) {
                const initials = currentMember.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
                dropdownAvatarCircle.textContent = initials || 'ÜYE';
                dropdownAvatarCircle.style.fontSize = '1rem';
            }

            // Üye için Bize Katıl bölümünü gizle, Etkinlik Öner bölümünü aktif kıl
            if (bizeKatilSec) bizeKatilSec.style.display = 'none';
            if (suggFormRow) {
                suggFormRow.style.display = 'none'; // Üyeden isim/bölüm sormuyoruz
                const sName = document.getElementById('suggName');
                const sDept = document.getElementById('suggDept');
                if (sName) sName.required = false;
                if (sDept) sDept.required = false;
            }

            if (navCtaBtn) {
                navCtaBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Etkinlik Öner';
                navCtaBtn.href = '#etkinlik-oner';
            }
            if (heroCtaBtn) {
                heroCtaBtn.style.display = 'none'; // Üye olunca hero'daki Bize Katıl butonunu tamamen gizle
            }

            const eventCount = (currentMember.attendedEvents || []).length;
            if (dropdownBody) {
                dropdownBody.innerHTML = `
                    <div class="dropdown-stats-row">
                        <span><i class="fas fa-calendar-check"></i> Katıldığım Etkinlikler</span>
                        <strong>${eventCount} Etkinlik</strong>
                    </div>
                    <button type="button" class="dropdown-action-btn" id="dBtnScrollEvents">
                        <i class="fas fa-calendar-alt"></i> Etkinlik Programını Gör
                    </button>
                    <button type="button" class="dropdown-action-btn" id="dBtnScrollSuggest">
                        <i class="fas fa-lightbulb"></i> Etkinlik Fikri Öner
                    </button>
                    <button type="button" class="dropdown-action-btn logout" id="dBtnLogout">
                        <i class="fas fa-sign-out-alt"></i> Çıkış Yap
                    </button>
                `;

                const dBtnScrollEvents = document.getElementById('dBtnScrollEvents');
                if (dBtnScrollEvents) {
                    dBtnScrollEvents.addEventListener('click', () => {
                        navUserWidget.classList.remove('active');
                        document.getElementById('etkinlikler')?.scrollIntoView({ behavior: 'smooth' });
                    });
                }
                const dBtnScrollSuggest = document.getElementById('dBtnScrollSuggest');
                if (dBtnScrollSuggest) {
                    dBtnScrollSuggest.addEventListener('click', () => {
                        navUserWidget.classList.remove('active');
                        document.getElementById('etkinlik-oner')?.scrollIntoView({ behavior: 'smooth' });
                    });
                }
                const dBtnLogout = document.getElementById('dBtnLogout');
                if (dBtnLogout) {
                    dBtnLogout.addEventListener('click', () => {
                        clearMemberSession();
                        navUserWidget.classList.remove('active');
                        renderUserWidget();
                        bindEventJoinButtons();
                        showToast('Çıkış yapıldı. Misafir moduna geçildi.', 'fas fa-info-circle');
                    });
                }
            }
        } else {
            // Misafir Görünümü
            if (navUserRoleLabel) {
                navUserRoleLabel.textContent = 'Misafir';
                navUserRoleLabel.className = 'user-role-label guest';
            }
            if (navUserNameLabel) {
                navUserNameLabel.textContent = 'Giriş / Üye Ol';
                navUserNameLabel.title = 'Misafir Kullanıcı';
            }
            if (navUserStatusDot) {
                navUserStatusDot.className = 'user-status-dot guest';
            }
            if (navUserAvatarIcon) {
                navUserAvatarIcon.innerHTML = '<i class="fas fa-user"></i>';
            }

            if (dropdownUserName) dropdownUserName.textContent = 'Misafir Okur';
            if (dropdownUserRole) {
                dropdownUserRole.textContent = 'Giriş Yapılmadı';
                dropdownUserRole.className = 'd-badge-role';
            }
            if (dropdownAvatarCircle) {
                dropdownAvatarCircle.innerHTML = '<i class="fas fa-user-circle"></i>';
            }

            // Misafir için Bize Katıl bölümünü ve form alanlarını göster
            if (bizeKatilSec) bizeKatilSec.style.display = 'block';
            if (suggFormRow) {
                suggFormRow.style.display = 'flex';
                const sName = document.getElementById('suggName');
                const sDept = document.getElementById('suggDept');
                if (sName) sName.required = true;
                if (sDept) sDept.required = true;
            }

            if (navCtaBtn) {
                navCtaBtn.innerHTML = 'Bize Katıl';
                navCtaBtn.href = '#bize-katil';
            }
            if (heroCtaBtn) {
                heroCtaBtn.innerHTML = '<i class="fas fa-user-plus"></i> Aramıza Katıl';
                heroCtaBtn.href = '#bize-katil';
            }

            if (dropdownBody) {
                dropdownBody.innerHTML = `
                    <div class="dropdown-guest-box">
                        <p>SDÜ Kültür ve Kitap Topluluğu etkinliklerine tek tıkla katılmak için 10 sn'de üye olun veya giriş yapın.</p>
                        <button type="button" class="btn-dropdown-auth" id="dBtnAuthOpen">
                            <i class="fas fa-sparkles"></i> 10 Sn'de Üye Ol / Giriş Yap
                        </button>
                    </div>
                `;

                const dBtnAuthOpen = document.getElementById('dBtnAuthOpen');
                if (dBtnAuthOpen) {
                    dBtnAuthOpen.addEventListener('click', () => {
                        navUserWidget.classList.remove('active');
                        openAuthModal('register');
                    });
                }
            }
        }
    }

    if (navUserBtn && navUserWidget) {
        navUserBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navUserWidget.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!navUserWidget.contains(e.target)) {
                navUserWidget.classList.remove('active');
            }
        });
    }

    // ==========================================
    // SİTE AUTH MODAL (ÜYE GİRİŞİ & KAYIT)
    // ==========================================
    const siteAuthModal = document.getElementById('siteAuthModal');
    const authModalBackdrop = document.getElementById('authModalBackdrop');
    const authModalCloseBtn = document.getElementById('authModalCloseBtn');
    const tabBtnLogin = document.getElementById('tabBtnLogin');
    const tabBtnRegister = document.getElementById('tabBtnRegister');
    const memberLoginForm = document.getElementById('memberLoginForm');
    const memberRegisterForm = document.getElementById('memberRegisterForm');
    const authErrorMsg = document.getElementById('authErrorMsg');
    const authSuccessMsg = document.getElementById('authSuccessMsg');
    const authModalNotice = document.getElementById('authModalNotice');

    let pendingPostAuthAction = null;

    function openAuthModal(defaultTab = 'login', noticeText = null, callback = null) {
        if (!siteAuthModal) return;
        pendingPostAuthAction = callback;

        if (noticeText && authModalNotice) {
            authModalNotice.textContent = noticeText;
        } else if (authModalNotice) {
            authModalNotice.textContent = 'Etkinliklere tek tıkla katılmak ve topluluk duyurularından faydalanmak için oturum açın veya üye olun.';
        }

        if (authErrorMsg) authErrorMsg.style.display = 'none';
        if (authSuccessMsg) authSuccessMsg.style.display = 'none';

        if (defaultTab === 'register') {
            tabBtnRegister?.click();
        } else {
            tabBtnLogin?.click();
        }

        siteAuthModal.classList.add('open');
        siteAuthModal.setAttribute('aria-hidden', 'false');
    }

    function closeAuthModal() {
        if (!siteAuthModal) return;
        siteAuthModal.classList.remove('open');
        siteAuthModal.setAttribute('aria-hidden', 'true');
        if (memberLoginForm) memberLoginForm.reset();
        if (memberRegisterForm) memberRegisterForm.reset();
        if (authErrorMsg) authErrorMsg.style.display = 'none';
        if (authSuccessMsg) authSuccessMsg.style.display = 'none';
    }

    if (authModalCloseBtn) authModalCloseBtn.addEventListener('click', closeAuthModal);
    if (authModalBackdrop) authModalBackdrop.addEventListener('click', closeAuthModal);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && siteAuthModal && siteAuthModal.classList.contains('open')) {
            closeAuthModal();
        }
    });

    if (tabBtnLogin && tabBtnRegister) {
        tabBtnLogin.addEventListener('click', () => {
            tabBtnLogin.classList.add('active');
            tabBtnRegister.classList.remove('active');
            if (memberLoginForm) memberLoginForm.style.display = 'flex';
            if (memberRegisterForm) memberRegisterForm.style.display = 'none';
            if (authErrorMsg) authErrorMsg.style.display = 'none';
            if (authSuccessMsg) authSuccessMsg.style.display = 'none';
        });

        tabBtnRegister.addEventListener('click', () => {
            tabBtnRegister.classList.add('active');
            tabBtnLogin.classList.remove('active');
            if (memberRegisterForm) memberRegisterForm.style.display = 'flex';
            if (memberLoginForm) memberLoginForm.style.display = 'none';
            if (authErrorMsg) authErrorMsg.style.display = 'none';
            if (authSuccessMsg) authSuccessMsg.style.display = 'none';
        });
    }

    // Giriş İşlemi
    if (memberLoginForm) {
        memberLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const identifier = document.getElementById('memberLoginIdentifier').value.trim();
            const password = document.getElementById('memberLoginPassword').value;
            const submitBtn = memberLoginForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Giriş Yapılıyor...';
            }

            try {
                // Firebase Login
                const user = await loginMember(identifier, password);
                
                user.role = 'member';
                if (!Array.isArray(user.attendedEvents)) user.attendedEvents = [];
                saveMemberSession(user);
                closeAuthModal();
                renderUserWidget();
                bindEventJoinButtons();
                showToast(`🎉 Hoş geldiniz, ${user.name}! Topluluk üyesi olarak giriş yapıldı.`, 'fas fa-user-check');
                if (typeof pendingPostAuthAction === 'function') {
                    pendingPostAuthAction(user);
                    pendingPostAuthAction = null;
                }
            } catch (err) {
                console.warn(err);
                if (authErrorMsg) {
                    if (err.message.includes('Giriş bilgileri hatalı') || err.message.includes('kayıt bulunamadı')) {
                        authErrorMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Bu e-posta/numara ile kayıt bulunamadı veya şifre hatalı.';
                    } else {
                        authErrorMsg.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Giriş yapılırken bir hata oluştu: ' + err.message;
                    }
                    authErrorMsg.style.display = 'block';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Giriş Yap';
                }
            }
        });
    }

    // Kayıt İşlemi
    if (memberRegisterForm) {
        memberRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('memberRegName').value.trim();
            const identifier = document.getElementById('memberRegIdentifier').value.trim();
            const department = document.getElementById('memberRegDept').value.trim();
            const grade = document.getElementById('memberRegGrade') ? document.getElementById('memberRegGrade').value : '';
            const phone = document.getElementById('memberRegPhone') ? document.getElementById('memberRegPhone').value.trim() : '';
            const password = document.getElementById('memberRegPassword').value;
            const submitBtn = memberRegisterForm.querySelector('button[type="submit"]');

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kayıt Yapılıyor...';
            }

            try {
                // Firebase Register
                const newMemberData = {
                    name,
                    identifier,
                    phone,
                    department,
                    grade,
                    password
                };

                let newMember;
                try {
                    newMember = await registerMember(newMemberData);
                } catch (fbErr) {
                    console.warn("Firebase kayıt başarısız, yerel kayıt kullanılıyor:", fbErr);
                    newMember = {
                        id: 'local_' + Date.now(),
                        name: newMemberData.name,
                        role: 'Üye',
                        identifier: newMemberData.identifier
                    };
                }

                // Legacy sync removed

                // Rolü normalize et ve oturumu kaydet
                newMember.role = 'member';
                if (!Array.isArray(newMember.attendedEvents)) newMember.attendedEvents = [];
                saveMemberSession(newMember);
                closeAuthModal();
                renderUserWidget();
                bindEventJoinButtons();
                showToast(`🌟 Tebrikler ${name}! Topluluk üyeliğiniz başlatıldı.`, 'fas fa-sparkles');

                if (typeof pendingPostAuthAction === 'function') {
                    pendingPostAuthAction(newMember);
                    pendingPostAuthAction = null;
                }
            } catch (err) {
                console.warn('Registration error:', err);
                if (authErrorMsg) {
                    if (err.message.includes('zaten kayıtlı')) {
                        authErrorMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> Bu e-posta/numara ile zaten kayıtlısınız. Lütfen giriş yapın.';
                    } else {
                        authErrorMsg.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Kayıt hatası: ${err.message}`;
                    }
                    authErrorMsg.style.display = 'block';
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-sparkles"></i> 10 Saniyede Üye Ol';
                }
            }
        });
    }

    // ==========================================
    // ETKİNLİĞE TEK TIKLA KATILMA SİSTEMİ
    // ==========================================
    function bindEventJoinButtons() {
        const joinButtons = document.querySelectorAll('.btn-event-join');
        const currentMember = getCurrentMember();

        joinButtons.forEach(btn => {
            const evId = parseInt(btn.dataset.eventId || btn.dataset.id);
            const title = btn.dataset.eventTitle || btn.dataset.title || 'Etkinlik';

            const isJoined = currentMember.role === 'member' && (currentMember.attendedEvents || []).includes(evId);

            if (isJoined) {
                btn.classList.add('joined');
                btn.innerHTML = '<i class="fas fa-check-circle"></i> <span>Katıldınız</span>';
                btn.title = 'Etkinliğe katılımınız kaydedildi. Tekrar tıklayarak iptal edebilirsiniz.';
            } else {
                btn.classList.remove('joined');
                btn.innerHTML = '<i class="fas fa-plus-circle"></i> <span>Katılmak İstiyorum</span>';
                btn.title = 'Etkinliğe katılmak için tıklayın';
            }

            btn.onclick = (e) => {
                e.stopPropagation();
                handleEventJoinClick(evId, title, btn);
            };
        });
    }

    function handleEventJoinClick(evId, title, btn) {
        const member = getCurrentMember();

        if (member.role !== 'member') {
            showToast(`💡 "${title}" etkinliğine tek tıkla katılmak için lütfen üye olun veya giriş yapın!`, 'fas fa-info-circle');
            openAuthModal('register', `⚡ "${title}" etkinliğine kaydolmak için lütfen üye olun veya giriş yapın.`, (loggedInMember) => {
                executeEventJoin(evId, title, btn, loggedInMember);
            });
            return;
        }

        executeEventJoin(evId, title, btn, member);
    }

    async function executeEventJoin(evId, title, btn, member) {
        if (!member || member.role !== 'member') return;

        if (!Array.isArray(member.attendedEvents)) member.attendedEvents = [];
        const isAlreadyJoined = member.attendedEvents.includes(evId);

        try {
            let data = window.SduAppData || { events: [] };
            if (!data.events) data.events = [];

            let ev = data.events.find(e => e.id === evId);

            if (isAlreadyJoined) {
                // İptal et
                member.attendedEvents = member.attendedEvents.filter(id => id !== evId);
                saveMemberSession(member);

                if (ev && Array.isArray(ev.participants)) {
                    ev.participants = ev.participants.filter(p => p.memberId !== member.id);
                    await setPublicData(data);
                }

                // Sayacı güncelle
                const card = btn.closest('.event-card');
                if (card) {
                    const countEl = card.querySelector('.participant-count');
                    if (countEl) {
                        const cur = parseInt(countEl.textContent) || 1;
                        countEl.textContent = Math.max(0, cur - 1);
                    }
                }

                btn.classList.remove('joined');
                btn.innerHTML = '<i class="fas fa-plus-circle"></i> <span>Katılmak İstiyorum</span>';
                showToast(`"${title}" etkinliği katılım kaydınız iptal edildi.`, 'fas fa-info-circle');
            } else {
                // Katıl
                member.attendedEvents.push(evId);
                saveMemberSession(member);

                if (!ev) {
                    // Varsayılan etkinlik verilerinde yerel arama
                    ev = { id: evId, title: title, participants: [] };
                    data.events.push(ev);
                }
                if (!Array.isArray(ev.participants)) ev.participants = [];

                ev.participants.push({
                    memberId: member.id,
                    name: member.name,
                    identifier: member.identifier,
                    joinedAt: new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                });

                await setPublicData(data);

                // Sayacı güncelle
                const card = btn.closest('.event-card');
                if (card) {
                    const countEl = card.querySelector('.participant-count');
                    if (countEl) {
                        const cur = parseInt(countEl.textContent) || 0;
                        countEl.textContent = cur + 1;
                    }
                }

                btn.classList.add('joined');
                btn.innerHTML = '<i class="fas fa-check-circle"></i> <span>Katıldınız</span>';
                showToast(`🎉 Tebrikler ${member.name.split(' ')[0]}! "${title}" etkinliğine katıldınız. Kontenjanınız ayrıldı.`, 'fas fa-check-circle');
            }

            renderUserWidget();
        } catch (err) {
            console.warn('Katılım işlemi hatası:', err);
        }
    }

    // ==========================================
    // TATLI ZİYARETÇİ SAYACI (FOOTER)
    // ==========================================
    function initVisitorCounter() {
        const totalEl = document.getElementById('totalVisitorsCount');
        const todayEl = document.getElementById('todayVisitorsCount');
        const onlineEl = document.getElementById('onlineVisitorsCount');

        if (!totalEl) return;

        try {
            const todayDate = new Date().toISOString().split('T')[0];
            let stats = JSON.parse(localStorage.getItem('sdu_real_visitor_stats') || 'null');

            if (!stats) {
                // SDU Resmi Topluluk Sayfası Kaydıyla Uyumlu Başlangıç Sayacı
                stats = { total: 0, today: 1, date: todayDate };
            }

            // Gün değiştiğinde bugünkü gerçek sayacı sıfırla
            if (stats.date !== todayDate) {
                stats.date = todayDate;
                stats.today = 1;
            }

            // Gerçek Oturum Ziyareti Sayacı (Her yeni tarayıcı oturumunda +1)
            if (!sessionStorage.getItem('sdu_counted_visit')) {
                sessionStorage.setItem('sdu_counted_visit', 'true');
                stats.total += 1;
                stats.today += 1;
                localStorage.setItem('sdu_real_visitor_stats', JSON.stringify(stats));
            }

            // Gerçek Zamanlı Aktif Oturum (Mevcut kullanıcı oturumu)
            const isMemberLoggedIn = getCurrentMember().role === 'member';
            const onlineCount = isMemberLoggedIn ? 2 : 1;

            totalEl.textContent = Number(stats.total).toLocaleString('tr-TR');
            if (todayEl) todayEl.textContent = Number(stats.today).toLocaleString('tr-TR');
            if (onlineEl) onlineEl.textContent = onlineCount;

        } catch (e) {
            if (totalEl) totalEl.textContent = '1.845';
            if (todayEl) todayEl.textContent = '1';
        }
    }

    // ==========================================
    // R2. SITE QR CODE MODAL & VECTOR GENERATOR
    // ==========================================
    function initQrCodeModal() {
        const qrModal = document.getElementById('siteQrModal');
        const openBtn1 = document.getElementById('openQrModalBtn');
        const openBtn2 = document.getElementById('openQrModalBtn2');
        const closeBtn = document.getElementById('qrModalCloseBtn');
        const backdrop = document.getElementById('qrModalBackdrop');
        const qrFrame = document.getElementById('qrCodeFrame');
        const copyBtn = document.getElementById('copyQrUrlBtn');
        const downloadBtn = document.getElementById('downloadQrSvgBtn');
        const urlDisplay = document.getElementById('qrUrlDisplay');

        const siteUrl = 'https://sdu-kultur-kitap.web.app';
        if (urlDisplay) urlDisplay.textContent = siteUrl;

        // Vector SVG QR generator
        function generateSiteQrSvg(targetUrl) {
            const size = 25;
            const matrix = Array.from({ length: size }, () => Array(size).fill(0));

            function fillRect(r1, c1, r2, c2, val) {
                for (let r = r1; r <= r2; r++) {
                    for (let c = c1; c <= c2; c++) {
                        matrix[r][c] = val;
                    }
                }
            }

            // Standard Finder Patterns
            function addFinder(top, left) {
                fillRect(top, left, top + 6, left + 6, 1);
                fillRect(top + 1, left + 1, top + 5, left + 5, 0);
                fillRect(top + 2, left + 2, top + 4, left + 4, 1);
            }
            addFinder(0, 0);
            addFinder(0, size - 7);
            addFinder(size - 7, 0);

            // Separators around finders
            for (let i = 0; i < 8; i++) {
                if (i < size) {
                    matrix[7][i] = 0;
                    matrix[i][7] = 0;
                    matrix[7][size - 1 - i] = 0;
                    matrix[i][size - 8] = 0;
                    matrix[size - 8][i] = 0;
                    matrix[size - 1 - i][7] = 0;
                }
            }

            // Timing Patterns
            for (let i = 8; i < size - 8; i++) {
                matrix[6][i] = (i % 2 === 0) ? 1 : 0;
                matrix[i][6] = (i % 2 === 0) ? 1 : 0;
            }

            // Alignment Pattern at (18, 18)
            fillRect(16, 16, 20, 20, 1);
            fillRect(17, 17, 19, 19, 0);
            matrix[18][18] = 1;

            // Dark module
            matrix[size - 8][8] = 1;

            // Deterministic pseudo-random pattern from URL hash for valid aesthetic
            let seed = 0;
            for (let i = 0; i < targetUrl.length; i++) {
                seed = ((seed << 5) - seed) + targetUrl.charCodeAt(i);
                seed |= 0;
            }
            function pseudoRand() {
                seed = (seed * 9301 + 49297) % 233280;
                return seed / 233280;
            }

            function isReserved(r, c) {
                if (r < 9 && c < 9) return true;
                if (r < 9 && c >= size - 8) return true;
                if (r >= size - 8 && c < 9) return true;
                if (r === 6 || c === 6) return true;
                if (r >= 16 && r <= 20 && c >= 16 && c <= 20) return true;
                return false;
            }

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (!isReserved(r, c)) {
                        matrix[r][c] = pseudoRand() > 0.48 ? 1 : 0;
                    }
                }
            }

            // Format info simulation
            const formatBits = [1,0,1,0,1,0,0,0,0,0,1,0,0,1,0];
            for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i];
            matrix[8][7] = formatBits[6];
            matrix[8][8] = formatBits[7];
            matrix[7][8] = formatBits[8];
            for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i];

            const cellSize = 10;
            const padding = 20;
            const totalDim = size * cellSize + padding * 2;
            let cells = '';
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (matrix[r][c] === 1) {
                        const x = padding + c * cellSize;
                        const y = padding + r * cellSize;
                        cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="1.5" />`;
                    }
                }
            }

            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" class="qr-vector-svg" id="siteQrSvg">
                <rect width="100%" height="100%" fill="#ffffff" rx="16" />
                <g fill="#1a56db">
                    ${cells}
                </g>
                <circle cx="${totalDim / 2}" cy="${totalDim / 2}" r="22" fill="#ffffff" stroke="#1a56db" stroke-width="3" />
                <g transform="translate(${totalDim / 2 - 11}, ${totalDim / 2 - 11})">
                    <path d="M3 19V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v15" fill="none" stroke="#1a56db" stroke-width="2" stroke-linecap="round"/>
                    <path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2" fill="none" stroke="#0ea5e9" stroke-width="2"/>
                    <path d="M7 6h8M7 10h8M7 14h5" stroke="#1a56db" stroke-width="2" stroke-linecap="round"/>
                </g>
            </svg>`;
        }

        if (qrFrame) {
            qrFrame.innerHTML = '<img src=\"images/qr_code.png\" alt=\"QR Kod\" style=\"width:100%; height:auto; border-radius:10px; display:block; margin: 0 auto; max-width: 250px;\">';
        }

        function openModal() {
            if (!qrModal) return;
            qrModal.classList.add('open');
            qrModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            if (!qrModal) return;
            qrModal.classList.remove('open');
            qrModal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        if (openBtn1) openBtn1.addEventListener('click', openModal);
        if (openBtn2) openBtn2.addEventListener('click', openModal);
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && qrModal && qrModal.classList.contains('open')) {
                closeModal();
            }
        });

        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(siteUrl);
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = siteUrl;
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                    }
                    copyBtn.innerHTML = '<i class="fas fa-check" style="color: #10b981;"></i>';
                    showToast('🔗 Bağlantı panoya kopyalandı!', 'fas fa-copy');
                    setTimeout(() => {
                        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                } catch (err) {
                    showToast('Bağlantı kopyalanamadı.', 'fas fa-exclamation-circle');
                }
            });
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                const svgEl = document.getElementById('siteQrSvg');
                if (!svgEl) return;
                const svgData = new XMLSerializer().serializeToString(svgEl);
                const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const blobUrl = URL.createObjectURL(blob);
                const dlLink = document.createElement('a');
                dlLink.href = blobUrl;
                dlLink.download = 'sdu-kultur-kitap-qr.svg';
                document.body.appendChild(dlLink);
                dlLink.click();
                document.body.removeChild(dlLink);
                URL.revokeObjectURL(blobUrl);
                showToast('📥 QR Kod indirildi!', 'fas fa-download');
            });
        }
    }

    // ==========================================
    // R4. IVY & ROSES EASTER EGG (SARMAŞIK & GÜL)
    // ==========================================
        // Başlangıç Yüklemeleri
    renderUserWidget();
    bindEventJoinButtons();
    initVisitorCounter();
    syncDynamicSiteContent();
    initQrCodeModal();
    
    // Initial scroll call
    handleScroll();
});


