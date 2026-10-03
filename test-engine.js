const TestEngine = {
    currentQuestionIndex: 0,
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
    },

    startTest: function() {
        document.getElementById('coverScreen').style.display = 'none';
        document.getElementById('questionScreen').style.display = 'block';
        this.currentQuestionIndex = 0;
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
        document.getElementById('questionText').innerText = q.text;
        document.getElementById('progressText').innerText = `Soru ${this.currentQuestionIndex + 1} / ${TEST_DATA.questions.length}`;
        const progressBar = document.getElementById('testProgressBar');
        if(progressBar) {
            progressBar.style.width = `${((this.currentQuestionIndex + 1) / TEST_DATA.questions.length) * 100}%`;
        }

        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = '';

        q.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt.text;
            btn.addEventListener('click', () => this.selectOption(opt.profile));
            optionsContainer.appendChild(btn);
        });
    },

    selectOption: function(profileImpact) {
        if (this.isProcessing) return;
        this.isProcessing = true;

        // Add scores
        for (let key in this.userProfile) {
            this.userProfile[key] += profileImpact[key];
        }

        this.currentQuestionIndex++;
        this.renderQuestion();
        
        // Wait for rendering to complete before allowing another click
        setTimeout(() => {
            this.isProcessing = false;
        }, 50);
    },

    finishTest: function() {
        document.getElementById('questionScreen').style.display = 'none';
        document.getElementById('resultScreen').style.display = 'block';
        
        // Calculate average
        const numQuestions = TEST_DATA.questions.length;
        for (let key in this.userProfile) {
            this.userProfile[key] /= numQuestions;
        }

        const character = this.findClosestCharacter();
        this.displayResult(character);
    },

    findClosestCharacter: function() {
        let bestMatch = null;
        let minDistance = Infinity;

        TEST_DATA.characters.forEach(char => {
            let distance = 0;
            for (let key in this.userProfile) {
                const diff = this.userProfile[key] - char.profile[key];
                distance += diff * diff;
            }
            distance = Math.sqrt(distance);

            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = char;
            }
        });

        return bestMatch;
    },

    displayResult: function(character) {
        document.getElementById('resName').innerText = character.name;
        document.getElementById('resBook').innerText = character.book;
        document.getElementById('resTraits').innerText = character.traits;
        
        const kwContainer = document.getElementById('resKeywords');
        kwContainer.innerHTML = '';
        character.keywords.forEach(kw => {
            const span = document.createElement('span');
            span.className = 'keyword-badge';
            span.innerText = kw;
            kwContainer.appendChild(span);
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    TestEngine.init();
});
