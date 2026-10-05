const TestEngine = {
    currentQuestionIndex: 0,
    answers: [], // Stores { optionIndex, profileImpact }
    isProcessing: false,
    userProfile: {
        extrovert: 0,
        dreamer: 0,
        emotional: 0,
        rebel: 0,
        dark: 0
    },

    init: function() {
        this.bindEvents();
    },

    bindEvents: function() {
        const startBtn = document.getElementById('startTestBtn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startTest());
        }

        const prevBtn = document.getElementById('prevQuestionBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevQuestion());
        }

        const restartBtn = document.getElementById('restartTestBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.startTest();
            });
        }

        const shareBtn = document.getElementById('shareResultBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareResult());
        }

        const showResultBtn = document.getElementById('showResultBtn');
        if (showResultBtn) {
            showResultBtn.addEventListener('click', () => {
                showResultBtn.disabled = true;
                showResultBtn.innerText = "Yükleniyor...";
                this.finalizeAndShowResult();
            });
        }
    },

    startTest: function() {
        const coverScreen = document.getElementById('coverScreen');
        const questionScreen = document.getElementById('questionScreen');
        const resultScreen = document.getElementById('resultScreen');

        if (coverScreen) {
            coverScreen.style.display = 'none';
            coverScreen.classList.remove('active');
        }
        if (resultScreen) {
            resultScreen.style.display = 'none';
            resultScreen.classList.remove('active');
        }
        if (questionScreen) {
            questionScreen.style.display = 'block';
            questionScreen.classList.add('active');
        }

        this.currentQuestionIndex = 0;
        this.answers = [];
        this.isProcessing = false;
        this.resetProfile();
        this.renderQuestion();
    },

    resetProfile: function() {
        this.userProfile = {
            extrovert: 0,
            dreamer: 0,
            emotional: 0,
            rebel: 0,
            dark: 0
        };
    },

    renderQuestion: function() {
        if (this.currentQuestionIndex >= TEST_DATA.questions.length) {
            this.finishTest();
            return;
        }

        const q = TEST_DATA.questions[this.currentQuestionIndex];
        const questionText = document.getElementById('questionText');
        if (questionText) questionText.innerText = q.text;

        const progressText = document.getElementById('progressText');
        if (progressText) {
            progressText.innerText = `Soru ${this.currentQuestionIndex + 1} / ${TEST_DATA.questions.length}`;
        }

        const progressBar = document.getElementById('testProgressBar');
        if (progressBar) {
            progressBar.style.width = `${((this.currentQuestionIndex + 1) / TEST_DATA.questions.length) * 100}%`;
        }

        const prevBtn = document.getElementById('prevQuestionBtn');
        if (prevBtn) {
            prevBtn.style.display = (this.currentQuestionIndex > 0) ? 'inline-flex' : 'none';
        }

        const optionsContainer = document.getElementById('optionsContainer');
        if (!optionsContainer) return;
        optionsContainer.innerHTML = '';

        const savedAnswer = this.answers[this.currentQuestionIndex];
        const selectedOptIdx = savedAnswer ? savedAnswer.optionIndex : -1;

        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'option-btn' + (idx === selectedOptIdx ? ' selected' : '');
            btn.innerText = opt.text;
            btn.setAttribute('data-index', idx);
            btn.addEventListener('click', () => this.selectOption(idx, opt.profile, btn));
            optionsContainer.appendChild(btn);
        });
    },

    selectOption: function(optionIndex, profileImpact, clickedBtn) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        const optionsContainer = document.getElementById('optionsContainer');
        if (optionsContainer) {
            const allBtns = optionsContainer.querySelectorAll('.option-btn');
            allBtns.forEach(btn => {
                btn.classList.remove('selected');
                btn.style.pointerEvents = 'none';
            });
        }

        if (clickedBtn) {
            clickedBtn.classList.add('selected');
        }

        // Store in answer history array for pure recalculation and back navigation
        this.answers[this.currentQuestionIndex] = {
            optionIndex: optionIndex,
            profileImpact: profileImpact
        };

        // Advance smoothly with 350ms delay to prevent mobile double-tap / touch skip
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.renderQuestion();
            this.isProcessing = false;
        }, 350);
    },

    prevQuestion: function() {
        if (this.isProcessing) return;
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
        }
    },

    finishTest: function() {
        const questionScreen = document.getElementById('questionScreen');
        const identityScreen = document.getElementById('identityScreen');

        if (questionScreen) {
            questionScreen.style.display = 'none';
            questionScreen.classList.remove('active');
        }
        if (identityScreen) {
            identityScreen.style.display = 'block';
            identityScreen.classList.add('active');
        }
    },

    finalizeAndShowResult: async function() {
        const identityScreen = document.getElementById('identityScreen');
        const resultScreen = document.getElementById('resultScreen');

        if (identityScreen) {
            identityScreen.style.display = 'none';
            identityScreen.classList.remove('active');
        }
        if (resultScreen) {
            resultScreen.style.display = 'block';
            resultScreen.classList.add('active');
        }

        const keys = ['extrovert', 'dreamer', 'emotional', 'rebel', 'dark'];
        const numAnswers = this.answers.length || 1;

        // Calculate average user profile across answered questions
        const userAvg = {};
        keys.forEach(k => {
            let sum = 0;
            for (let i = 0; i < this.answers.length; i++) {
                sum += (this.answers[i].profileImpact[k] || 0);
            }
            userAvg[k] = sum / numAnswers;
            this.userProfile[k] = userAvg[k];
        });

        const character = this.findClosestCharacter(userAvg);

        const nameInput = document.getElementById('userNameInput');
        const userName = (nameInput && nameInput.value.trim() !== '') ? nameInput.value.trim() : 'Anonim';
        
        this.displayResult(character, userAvg);

        if (window.saveTestResult) {
            try {
                await window.saveTestResult({
                    name: userName,
                    character: character.name,
                    dimensions: userAvg
                });
            } catch (e) {
                console.error("Firebase save error", e);
            }
        }
    },

    findClosestCharacter: function(userAvg) {
        const keys = ['extrovert', 'dreamer', 'emotional', 'rebel', 'dark'];
        const u = userAvg || this.userProfile;
        const uVals = keys.map(k => u[k]);
        const uMean = uVals.reduce((a, b) => a + b, 0) / uVals.length;

        let bestMatch = null;
        let bestScore = -Infinity;

        // Centered Cosine Similarity / Pearson Correlation for 100% character reachability
        TEST_DATA.characters.forEach(char => {
            const cVals = keys.map(k => char.profile[k]);
            const cMean = cVals.reduce((a, b) => a + b, 0) / cVals.length;

            let num = 0;
            let denU = 0;
            let denC = 0;

            for (let i = 0; i < keys.length; i++) {
                const du = uVals[i] - uMean;
                const dc = cVals[i] - cMean;
                num += du * dc;
                denU += du * du;
                denC += dc * dc;
            }

            const sim = (denU > 0 && denC > 0) ? (num / (Math.sqrt(denU) * Math.sqrt(denC))) : 0;
            if (sim > bestScore) {
                bestScore = sim;
                bestMatch = char;
            }
        });

        return bestMatch || TEST_DATA.characters[0];
    },

    displayResult: function(character, userAvg) {
        const resName = document.getElementById('resName');
        if (resName) resName.innerText = character.name;

        const resBook = document.getElementById('resBook');
        if (resBook) resBook.innerText = character.book;

        const resTraits = document.getElementById('resTraits');
        if (resTraits) resTraits.innerText = character.traits;

        const kwContainer = document.getElementById('resKeywords');
        if (kwContainer) {
            kwContainer.innerHTML = '';
            character.keywords.forEach(kw => {
                const span = document.createElement('span');
                span.className = 'keyword-badge';
                span.innerText = kw;
                kwContainer.appendChild(span);
            });
        }

        // 5-Dimension Personality Trait Visualization
        this.renderTraitBreakdown(userAvg || this.userProfile);
    },

    renderTraitBreakdown: function(profile) {
        const breakdownContainer = document.getElementById('traitBreakdown');
        if (!breakdownContainer) return;

        const traitsConfig = [
            { key: 'extrovert', label: 'Dışadönüklük', icon: 'fa-users' },
            { key: 'dreamer', label: 'Hayalperestlik', icon: 'fa-cloud-moon' },
            { key: 'emotional', label: 'Duygusallık', icon: 'fa-heart' },
            { key: 'rebel', label: 'Asilik & Özgürlük', icon: 'fa-fire' },
            { key: 'dark', label: 'Gizem & Derinlik', icon: 'fa-mask' }
        ];

        breakdownContainer.innerHTML = `
            <h4 class="trait-breakdown-title">
                <i class="fas fa-chart-simple"></i> Kişilik Boyutların
            </h4>
            <div class="trait-list">
                ${traitsConfig.map(t => {
                    const rawVal = profile[t.key] || 0;
                    // Scale from average (0..10) to percentage (0..100)
                    const percentage = Math.min(100, Math.max(0, Math.round((rawVal / 10) * 100)));
                    return `
                        <div class="trait-item">
                            <div class="trait-header">
                                <span class="trait-name"><i class="fas ${t.icon}"></i> ${t.label}</span>
                                <span class="trait-value">%${percentage}</span>
                            </div>
                            <div class="trait-track">
                                <div class="trait-fill" style="width: ${percentage}%;"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    },

    shareResult: function() {
        const charName = document.getElementById('resName') ? document.getElementById('resName').innerText : '';
        const charBook = document.getElementById('resBook') ? document.getElementById('resBook').innerText : '';
        const text = `Kültür & Kitap Kulübü roman karakteri testinde ruh eşim "${charName}" (${charBook}) çıktı! Sen hangi karaktersin?`;
        const url = window.location.href;

        if (navigator.share) {
            navigator.share({
                title: 'Hangi Roman Karakterisin? | Kültür & Kitap',
                text: text,
                url: url
            }).catch(err => {
                if (err.name !== 'AbortError') {
                    this.copyToClipboard(text, url);
                }
            });
        } else {
            this.copyToClipboard(text, url);
        }
    },

    copyToClipboard: function(text, url) {
        const fullShare = `${text}\n${url}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(fullShare).then(() => {
                this.showToast('Sonuç bağlantısı panoya kopyalandı!');
            }).catch(() => {
                this.openWhatsApp(text, url);
            });
        } else {
            this.openWhatsApp(text, url);
        }
    },

    openWhatsApp: function(text, url) {
        this.showToast('Paylaşım bağlantısı açılıyor...');
        const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + '\n' + url)}`;
        try {
            window.open(waUrl, '_blank');
        } catch (e) {
            // Popup blocked or headless fallback
        }
    },

    showToast: function(message) {
        let toast = document.getElementById('testToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'testToast';
            toast.className = 'test-toast';
            document.body.appendChild(toast);
        }
        toast.innerText = message;
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
        }, 3000);
    }
};

window.TestEngine = TestEngine;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        TestEngine.init();
    });
} else {
    TestEngine.init();
}
