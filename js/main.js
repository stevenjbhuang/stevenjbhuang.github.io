// Dark mode toggle
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = themeToggle ? themeToggle.querySelector('i') : null;

const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);
if (themeIcon) updateThemeIcon(savedTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });
}

function updateThemeIcon(theme) {
    if (themeIcon) themeIcon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Starlight background (dark mode only)
const bgCanvas = document.querySelector('.bg-canvas');
if (bgCanvas) {
    const bgCtx = bgCanvas.getContext('2d');
    const stars = [];
    const STAR_COUNT = 200;

    function resizeBg() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeBg);
    resizeBg();

    for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * bgCanvas.width,
            y: Math.random() * bgCanvas.height,
            size: Math.random() * 1.5 + 0.3,
            baseOpacity: Math.random() * 0.8 + 0.2,
            twinkleSpeed: Math.random() * 0.02 + 0.005,
            twinklePhase: Math.random() * Math.PI * 2
        });
    }

    let time = 0;

    function animateBg() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

        if (isDark) {
            time++;
            stars.forEach(star => {
                const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
                const opacity = star.baseOpacity * (0.5 + 0.5 * twinkle);

                const gradient = bgCtx.createRadialGradient(
                    star.x, star.y, 0, star.x, star.y, star.size * 2
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

                bgCtx.beginPath();
                bgCtx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
                bgCtx.fillStyle = gradient;
                bgCtx.fill();

                bgCtx.beginPath();
                bgCtx.arc(star.x, star.y, star.size * 0.5, 0, Math.PI * 2);
                bgCtx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                bgCtx.fill();
            });
        }

        requestAnimationFrame(animateBg);
    }
    animateBg();
}

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// Scroll fade-in animation
const fadeElements = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

fadeElements.forEach(el => observer.observe(el));

// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-links a').forEach(a => {
                a.classList.remove('active');
                if (a.getAttribute('href') === `#${sectionId}`) {
                    a.classList.add('active');
                }
            });
        }
    });
});

// Text scramble effect (only active in matrix mode)
let scrambleEnabled = false;

class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________';
        this.originalText = el.textContent;
    }

    setText(newText) {
        const length = Math.max(this.originalText.length, newText.length);
        const promise = new Promise(resolve => this.resolve = resolve);
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = this.originalText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }
        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.queue[i].char = char;
                }
                output += `<span style="opacity:0.5">${char}</span>`;
            } else {
                output += from;
            }
        }
        this.el.innerHTML = output;
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(() => this.update());
            this.frame++;
        }
    }
}

document.querySelectorAll('.scramble').forEach(el => {
    const scramble = new TextScramble(el);
    el.addEventListener('mouseenter', () => {
        if (scrambleEnabled) {
            scramble.setText(el.dataset.text || scramble.originalText);
        }
    });
});

// Matrix mode - press 'e' 3 times to toggle
let eCount = 0;
let eTimeout;
let matrixActive = false;
let matrixAnimating = false;
let matrixCanvas, matrixCtx, matrixAnimFrame, matrixTimeout;

document.addEventListener('keydown', (e) => {
    if (e.key === 'e' && !matrixAnimating) {
        eCount++;
        clearTimeout(eTimeout);
        eTimeout = setTimeout(() => { eCount = 0; }, 1000);
        if (eCount >= 3) {
            toggleMatrixMode();
            eCount = 0;
        }
    }
});

function deactivateMatrix() {
    matrixActive = false;
    document.documentElement.classList.remove('matrix-mode');
    document.documentElement.setAttribute('data-matrix', 'false');
    scrambleEnabled = false;
    document.querySelectorAll('.scramble').forEach(el => {
        el.textContent = el.dataset.text || el.textContent;
    });
}

function toggleMatrixMode() {
    matrixAnimating = true;
    if (matrixActive) {
        playMatrixSound(true);
        startMatrixRain(() => {
            deactivateMatrix();
            matrixAnimating = false;
        });
    } else {
        matrixActive = true;
        document.documentElement.classList.add('matrix-mode');
        document.documentElement.setAttribute('data-matrix', 'true');
        scrambleEnabled = true;
        playMatrixSound(false);
        startMatrixRain(() => {
            matrixAnimating = false;
        });
    }
}

function startMatrixRain(onComplete) {
    clearTimeout(matrixTimeout);
    cancelAnimationFrame(matrixAnimFrame);
    if (matrixCanvas) {
        matrixCanvas.remove();
    }

    matrixCanvas = document.createElement('canvas');
    matrixCanvas.className = 'matrix-bg';
    document.body.appendChild(matrixCanvas);
    matrixCtx = matrixCanvas.getContext('2d');
    matrixCanvas.width = window.innerWidth;
    matrixCanvas.height = window.innerHeight;

    const chars = '01アイウエオカキクケコサシスセソタチツテト';
    const fontSize = 14;
    const columns = Math.floor(matrixCanvas.width / fontSize);
      const drops = Array(columns).fill(0).map(() => -(Math.floor(Math.random() * (matrixCanvas.height / fontSize)) - 1));
    const speeds = Array(columns).fill(0).map(() => Math.floor(Math.random() * 3) + 2);
    let fadeStarted = false;
    let opacity = 1;
    let frameCount = 0;

     function draw() {
        if (fadeStarted) {
            opacity -= 0.03;
            if (opacity <= 0) {
                opacity = 0;
                matrixCanvas.remove();
                matrixCanvas = null;
                if (onComplete) onComplete();
                return;
            }
        }

        matrixCtx.fillStyle = `rgba(9, 9, 11, ${0.02 * opacity})`;
        matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

        matrixCtx.font = fontSize + 'px monospace';

        frameCount++;
        for (let i = 0; i < drops.length; i++) {
            if (frameCount % speeds[i] === 0) {
                const headY = drops[i] * fontSize;
                const text = chars[Math.floor(Math.random() * chars.length)];

                matrixCtx.fillStyle = `rgba(0, 255, 65, ${opacity})`;
                matrixCtx.fillText(text, i * fontSize, headY);

                if (headY > matrixCanvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }

        matrixAnimFrame = requestAnimationFrame(draw);
    }

    matrixCtx.fillStyle = 'rgba(9, 9, 11, 1)';
    matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    draw();

    matrixTimeout = setTimeout(() => {
        fadeStarted = true;
    }, 3000);

    window.addEventListener('resize', () => {
        if (matrixCanvas) {
            matrixCanvas.width = window.innerWidth;
            matrixCanvas.height = window.innerHeight;
        }
    });
}

function playMatrixSound(reverse) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 659.25, 523.25, 1046.50];
        const durations = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.25];
        let time = audioCtx.currentTime;

        (reverse ? notes.slice().reverse() : notes).forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.06, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + durations[i]);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(time);
            osc.stop(time + durations[i]);
            time += durations[i];
        });
    } catch (e) {}
}
