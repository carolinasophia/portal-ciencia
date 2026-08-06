// Mobile Menu Toggle (futuro)
document.addEventListener('DOMContentLoaded', function() {

    // ==========================================
    // GERENCIAMENTO DE ESTADO DE LOGIN
    // ==========================================
    const usuarioLogado = localStorage.getItem('usuarioLogado');

    if (usuarioLogado) {
        try {
            const usuario = JSON.parse(usuarioLogado);
            // Captura todos os links de navegação do menu
            const links = document.querySelectorAll('.nav-link, nav a, header a');
            
            links.forEach(link => {
                const texto = link.textContent.trim().toLowerCase();
                
                if (texto === 'login') {
                    // Transforma o botão de login no link do perfil
                    link.textContent = 'Meu Perfil';
                    link.href = './perfil.html';
                }
                if (texto === 'cadastro') {
                    // Oculta o botão de cadastro já que o usuário está logado
                    link.style.display = 'none';
                }
            });
        } catch (e) {
            console.error("Erro ao processar dados de login:", e);
        }
    }
    // ==========================================


    // Canvas interativo - Partículas científicas
    const canvas = document.getElementById('scienceCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        let mouse = { x: 0, y: 0 };

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 0.5) * 2;
                this.size = Math.random() * 4 + 1;
                this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
                // Atração do mouse
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    this.vx += dx * 0.01;
                    this.vy += dy * 0.01;
                }
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 100; i++) particles.push(new Particle());

        function animate() {
            ctx.fillStyle = 'rgba(12, 12, 46, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animate);
        }
        animate();

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        });
        canvas.addEventListener('touchmove', (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.touches[0].clientX - rect.left;
            mouse.y = e.touches[0].clientY - rect.top;
        });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            if (window.scrollY > 100) {
                navbar.style.background = 'rgba(12, 12, 46, 0.95)';
            } else {
                navbar.style.background = 'linear-gradient(135deg, #0c0c2e 0%, #1a1a4e 100%)';
            }
        }
    });

    // Active nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Smooth scroll para seções
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href')); // Corrigido o erro de digitação original (.query)
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Parallax effect para partículas
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const particlesList = document.querySelectorAll('.particle');
        particlesList.forEach((particle, index) => {
            const speed = 0.5 + (index * 0.1);
            particle.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // Intersection Observer para animações
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observar cards
    document.querySelectorAll('.feature-card, .experiment-card, .article-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Hero glow animation contânua
    const heroTitle = document.querySelector('.hero h1');
    if (heroTitle) {
        setInterval(() => {
            heroTitle.style.animationPlayState = 'running';
        }, 4000);
    }
});