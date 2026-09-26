/* ==========================================================================
   Akash Raj Portfolio - Studio Interactive & Cinematic UI Script
   - Custom Magnetic Cursor & Spring Follower
   - 3D Dynamic Card Perspective Tilt & Glare Reflections
   - GSAP ScrollTrigger Text & Section Reveal Animations
   - Scroll Progress Indicator & Dynamic Navbar Glassmorphism
   - N64 Controller Sound Deck & Project Modal System
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  /* ------------------------------------------------------------------------
     1. Custom Magnetic Cursor & Spring Follower
     ------------------------------------------------------------------------ */
  const cursor = document.getElementById('custom-cursor');
  const follower = document.getElementById('cursor-follower');
  let cursorX = -100, cursorY = -100;
  let followerX = -100, followerY = -100;

  if (cursor && follower && window.innerWidth >= 768) {
    document.addEventListener('mousemove', (e) => {
      cursorX = e.clientX;
      cursorY = e.clientY;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    });

    const updateFollower = () => {
      followerX += (cursorX - followerX) * 0.18;
      followerY += (cursorY - followerY) * 0.18;
      follower.style.transform = `translate3d(${followerX}px, ${followerY}px, 0)`;
      requestAnimationFrame(updateFollower);
    };
    requestAnimationFrame(updateFollower);

    // Magnetic effect on interactive targets
    const magneticTargets = document.querySelectorAll(
      '.btn, .nav-links a, .n64-pill-btn, .hud-btn, .filter-btn, .pad-btn, .n64-btn, .c-btn, .copy-btn, .hud-action-btn'
    );

    magneticTargets.forEach(target => {
      target.addEventListener('mousemove', (e) => {
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const deltaX = (e.clientX - centerX) * 0.25;
        const deltaY = (e.clientY - centerY) * 0.25;

        target.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
        follower.classList.add('cursor-hover');
      });

      target.addEventListener('mouseleave', () => {
        target.style.transform = `translate3d(0, 0, 0)`;
        follower.classList.remove('cursor-hover');
      });
    });
  }

  /* ------------------------------------------------------------------------
     2. 3D Card Perspective Tilt & Dynamic Glare Effect
     ------------------------------------------------------------------------ */
  const tiltCards = document.querySelectorAll(
    '.project-card, .skill-category-card, .timeline-content, .cred-card, .about-card, .controller-card, .c-info-card'
  );

  tiltCards.forEach(card => {
    // Add glare element if not present
    let glare = card.querySelector('.card-glare');
    if (!glare) {
      glare = document.createElement('div');
      glare.className = 'card-glare';
      card.appendChild(glare);
    }

    card.addEventListener('mousemove', (e) => {
      if (window.innerWidth < 768) return;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = -((y - centerY) / centerY) * 8;
      const rotateY = ((x - centerX) / centerX) * 8;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`;

      // Move specular glare
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
      glare.style.opacity = '1';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      if (glare) glare.style.opacity = '0';
    });
  });

  /* ------------------------------------------------------------------------
     3. GSAP ScrollTrigger Cinematic Section Reveals & Scroll Progress
     ------------------------------------------------------------------------ */
  const scrollProgress = document.getElementById('scroll-progress');
  const navbar = document.querySelector('.navbar');

  window.addEventListener('scroll', () => {
    // Scroll progress bar width
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / totalHeight) * 100;
    if (scrollProgress) scrollProgress.style.width = `${progress}%`;

    // Dynamic Navbar glassmorphism transform
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    // Dynamic active section indicator (Scrollspy)
    updateActiveNavLink();
  });

  // Scrollspy: real-time active nav link & aria-current
  const sections = document.querySelectorAll('section[id]');
  const navAnchorLinks = document.querySelectorAll('.nav-links a');

  function updateActiveNavLink() {
    const scrollPos = window.scrollY + 180;
    let currentId = '';
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
      }
    });

    navAnchorLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isMatch = Boolean(currentId && href === `#${currentId}`);
      link.classList.toggle('active', isMatch);
      if (isMatch) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  // Initial call on load
  updateActiveNavLink();

  // GSAP ScrollTrigger Section & Element Reveals
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    // Fade and stagger reveal section titles & tags
    const animateSections = document.querySelectorAll('.section, .hero-section');
    animateSections.forEach(sec => {
      const tag = sec.querySelector('.section-tag, .n64-banner');
      const title = sec.querySelector('.section-title, .hero-title');
      const subtitle = sec.querySelector('.section-subtitle, .hero-subtitle');
      const cards = sec.querySelectorAll('.about-card, .skill-category-card, .timeline-item, .project-card, .cred-card, .c-info-card');

      const elementsToAnimate = [tag, title, subtitle].filter(Boolean);

      if (elementsToAnimate.length > 0) {
        gsap.fromTo(elementsToAnimate,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sec,
              start: 'top 80%'
            }
          }
        );
      }

      if (cards.length > 0) {
        gsap.fromTo(cards,
          { opacity: 0, y: 40, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sec,
              start: 'top 75%'
            }
          }
        );
      }
    });
  }

  /* ------------------------------------------------------------------------
     4. Audio & BGM Toggles
     ------------------------------------------------------------------------ */
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const soundStatus = document.getElementById('sound-status');
  const musicToggleBtn = document.getElementById('music-toggle-btn');
  const musicStatus = document.getElementById('music-status');

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', () => {
      const isEnabled = window.soundEngine.sfxEnabled;
      window.soundEngine.sfxEnabled = !isEnabled;
      soundStatus.textContent = !isEnabled ? 'ON' : 'OFF';
      if (!isEnabled) window.soundEngine.playCoin();
    });
  }

  if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', () => {
      const isEnabled = window.soundEngine.bgmEnabled;
      window.soundEngine.toggleBGM(!isEnabled);
      musicStatus.textContent = !isEnabled ? 'ON' : 'OFF';
    });
  }

  /* ------------------------------------------------------------------------
     5. 3D Mario HUD Controls & Preset Switcher
     ------------------------------------------------------------------------ */
  const hudButtons = document.querySelectorAll('.hud-btn');
  hudButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      hudButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const style = btn.getAttribute('data-style');
      if (window.mario3D) {
        window.mario3D.setStyle(style);
      }
      if (window.soundEngine) {
        window.soundEngine.playCoin();
      }
    });
  });

  const resetFaceBtn = document.getElementById('reset-face-btn');
  if (resetFaceBtn) {
    resetFaceBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.mario3D) {
        window.mario3D.resetFace();
      }
      if (window.soundEngine) {
        window.soundEngine.playBoing(1.5);
      }
    });
  }

  const boingTestBtn = document.getElementById('boing-test-btn');
  if (boingTestBtn) {
    boingTestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.mario3D) {
        window.mario3D.targetRotation.x = (Math.random() - 0.5) * 0.8;
        window.mario3D.targetRotation.y = (Math.random() - 0.5) * 1.2;
      }
      if (window.soundEngine) {
        window.soundEngine.playBoing(1.8);
      }
    });
  }

  /* ------------------------------------------------------------------------
     6. N64 Controller Deck Interactions
     ------------------------------------------------------------------------ */
  const btnA = document.getElementById('btn-a');
  const btnB = document.getElementById('btn-b');
  const btnZ = document.getElementById('btn-z');
  const joystickKnob = document.getElementById('joystick-knob');

  if (btnA) {
    btnA.addEventListener('click', () => {
      if (window.soundEngine) {
        window.soundEngine.playJump();
        window.soundEngine.speakMario("Yahoo! It's-a me, Akash!");
      }
      triggerConfetti();
    });
  }

  if (btnB) {
    btnB.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playBoing(1.5);
      if (window.mario3D) window.mario3D.resetFace();
    });
  }

  if (btnZ) {
    btnZ.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playCoin();
      if (window.mario3D) {
        window.mario3D.targetCamPos.z = window.mario3D.targetCamPos.z === 9 ? 5.5 : 9;
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    const padBtn = document.querySelector(`.pad-btn[data-key="${e.key}"]`);
    if (padBtn) padBtn.classList.add('pressed');

    if (window.mario3D) {
      if (e.key === 'ArrowUp') window.mario3D.targetRotation.x = -0.4;
      if (e.key === 'ArrowDown') window.mario3D.targetRotation.x = 0.4;
      if (e.key === 'ArrowLeft') window.mario3D.targetRotation.y = -0.6;
      if (e.key === 'ArrowRight') window.mario3D.targetRotation.y = 0.6;
    }

    if (joystickKnob) {
      if (e.key === 'ArrowUp') joystickKnob.style.transform = 'translateY(-10px)';
      if (e.key === 'ArrowDown') joystickKnob.style.transform = 'translateY(10px)';
      if (e.key === 'ArrowLeft') joystickKnob.style.transform = 'translateX(-10px)';
      if (e.key === 'ArrowRight') joystickKnob.style.transform = 'translateX(10px)';
    }
  });

  window.addEventListener('keyup', (e) => {
    const padBtn = document.querySelector(`.pad-btn[data-key="${e.key}"]`);
    if (padBtn) padBtn.classList.remove('pressed');

    if (joystickKnob) {
      joystickKnob.style.transform = 'translate(0, 0)';
    }
  });

  /* ------------------------------------------------------------------------
     7. Project Filtering
     ------------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const categories = card.getAttribute('data-category');
        if (filter === 'all' || categories.includes(filter)) {
          card.style.display = 'flex';
          if (typeof gsap !== 'undefined') {
            gsap.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4 });
          }
        } else {
          card.style.display = 'none';
        }
      });

      if (window.soundEngine) window.soundEngine.playCoin();
    });
  });

  /* ------------------------------------------------------------------------
     8. Project Details Modal
     ------------------------------------------------------------------------ */
  const projectModal = document.getElementById('project-modal');
  const projectModalBody = document.getElementById('project-modal-body');
  const projectModalCloseBtn = document.getElementById('project-modal-close-btn');

  const projectData = {
    chapterchat: {
      title: 'ChapterChat - Streamlit PDF Q&A App (RAG with Google Gemini)',
      category: 'Generative AI & RAG Engineering',
      tech: ['Python', 'Streamlit', 'Google Gemini API', 'ChromaDB', 'Hugging Face Embeddings', 'RAG'],
      desc: 'Streamlit PDF question-answering app. Upload a book, build a local vector index, and ask questions with answers grounded in the document. Powered by Google Gemini for generative responses, Hugging Face embeddings for semantic search, and Chroma for local vector storage.',
      live: 'https://rrvtdh73jqf8n2kmwhhabn.streamlit.app/',
      features: [
        'Upload and index PDF books directly from the Streamlit sidebar',
        'Semantic search retrieval with Maximal Marginal Relevance (MMR)',
        'Contextual answer generation grounded in the document via Google Gemini',
        'Source page references and citations displayed for every answer',
        'Local session-persistent Chroma vector database index',
        'Dual interface: Interactive Streamlit Web UI + Command-line CLI chat'
      ]
    },
    mindmend: {
      title: 'MindMend - AI Mental Wellness Platform',
      category: 'AI & Full Stack Web Development',
      tech: ['Python', 'Django', 'AI/ML', 'Razorpay', 'React.js'],
      desc: 'Built an AI-enabled mental health platform using Django, secure chat, counsellor booking with Razorpay payment gateway, and mood tracking.',
      github: 'https://github.com/Akash-raj-INT/MindMend',
      features: [
        'AI sentiment analysis and mood tracking dashboard',
        'Counsellor booking integration with Razorpay payments',
        'Real-time encrypted user-counsellor communication',
        'Personalized self-reflection therapeutic recommendations'
      ]
    },
    heart: {
      title: 'Heart Disease Prediction System',
      category: 'Healthcare Machine Learning',
      tech: ['Python', 'Scikit-Learn', 'Pandas', 'NumPy', 'Streamlit'],
      desc: 'AI-powered web application that predicts the likelihood of heart disease using machine learning based on patient health parameters.',
      github: 'https://github.com/Akash-raj-INT/Heart-Dieseas-Prediction',
      features: [
        'Trained on UCI Heart Disease dataset using Random Forest & Logistic Regression',
        'Interactive Streamlit UI for immediate clinical risk classification',
        'Feature importance breakdown identifying primary health markers',
        'High accuracy cross-validation testing pipeline'
      ]
    },
    lms: {
      title: 'Web LMS (Library Management System)',
      category: 'Full Stack & Database Engineering',
      tech: ['Python', 'Django', 'Tailwind CSS', 'SQLite', 'JavaScript'],
      desc: 'Developed a web-based platform with user authentication, real-time book availability tracking, automated fine calculation, and modern responsive UI using Tailwind CSS.',
      github: 'https://github.com/Akash-raj-INT/LMS?tab=readme-ov-file',
      features: [
        'Role-based authentication for admin, librarian, and members',
        'Real-time inventory lookup and digital book checkout tracking',
        'Automated overdue fine computation and penalty notifications',
        'Modern responsive dashboard built with Tailwind CSS'
      ]
    },
    'fitness-web': {
      title: 'Fitness Club Website',
      category: 'Frontend Web Development',
      tech: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Web Design'],
      desc: 'Modern fitness website built with HTML, CSS, and JavaScript for dynamic content delivery.',
      live: 'https://fitness-clubb-bxcv.onrender.com/index.html',
      features: [
        'Interactive workout schedule and trainer profile showcase',
        'Dynamic membership calculator with custom package selections',
        'Smooth scroll transitions and responsive CSS Flexbox/Grid layout',
        'Contact and trial booking form with validation'
      ]
    },
    coffee: {
      title: 'Coffee Chain Sales Analytics Dashboard',
      category: 'Business Intelligence & Analytics',
      tech: ['Tableau', 'Power BI', 'MS Excel', 'SQL', 'Data Analytics'],
      desc: 'Interactive data visualization dashboard using Tableau with advanced charting and analytics features.',
      github: 'https://github.com/Akash-raj-INT/Project',
      features: [
        'Multi-regional revenue breakdown with dynamic filter slicers',
        'Inventory turnover velocity and stock depletion tracking',
        'Product category profit margin & sales volume comparison',
        'Executive decision-making summaries and quarterly forecasts'
      ]
    },
    'car-sales': {
      title: 'Car Sales Data Analysis & Visualization',
      category: 'Data Science & Visual Analytics',
      tech: ['Data Analysis', 'Data Visualization', 'Python', 'Pandas', 'Matplotlib'],
      desc: 'Developed comprehensive data analysis and visualization system for car sales data with interactive dashboards and insights.',
      github: 'https://github.com/Akash-raj-INT',
      features: [
        'Exploratory Data Analysis (EDA) uncovering regional sales trends',
        'Interactive charts visualizing vehicle brand market share',
        'Price variance and depreciation modeling',
        'Automated Pandas data cleaning and processing pipeline'
      ]
    },
    'crypto-blog': {
      title: 'Crypto-AI-Gaming Blog Platform',
      category: 'Content Management & Web Publishing',
      tech: ['Content Management', 'Blogger', 'SEO', 'HTML/CSS'],
      desc: 'Multi-topic blog platform covering cryptocurrency trends, artificial intelligence breakthroughs, and gaming content.',
      live: 'https://myblo0ogs.blogspot.com/2024/08/gaming.html',
      features: [
        'Search Engine Optimization (SEO) tuned article formatting',
        'Categorized multi-niche publication structure (Web3, AI, Gaming)',
        'Responsive reading layout optimized for desktop and mobile',
        'Integrated social sharing and community comment sections'
      ]
    },
    restaurant: {
      title: 'Restaurant Websites (LPU Burgers & Barney\'s Burgers)',
      category: 'Web Development & Food Service UX',
      tech: ['HTML5', 'CSS3', 'JavaScript', 'Web Design', 'UI/UX'],
      desc: 'Developed modern food service websites for LPU Burgers & Barney\'s Burgers with modern design, interactive digital menus, and online ordering.',
      live: 'https://lpuburgers.weebly.com/',
      features: [
        'Interactive digital menu filterable by burgers, sides, and beverages',
        'Online table reservation and takeaway order booking portal',
        'Vibrant food imagery showcase with dynamic hover animations',
        'Mobile-first responsive ordering workflow'
      ]
    }
  };

  window.openProjectDetailsModal = function (projKey) {
    const data = projectData[projKey];
    if (!data || !projectModal || !projectModalBody) return;

    const actionsHtml = `
      <div class="modal-link-highlight" style="background: linear-gradient(135deg, rgba(0, 153, 255, 0.18), rgba(16, 185, 129, 0.18)); border: 2px solid var(--mario-blue); border-radius: 12px; padding: 18px 20px; margin: 18px 0; box-shadow: 0 8px 30px rgba(0, 153, 255, 0.25);">
        <div style="font-family: var(--font-retro); font-size: 0.78rem; color: var(--mario-yellow); margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="link"></i> DIRECT PROJECT LINK
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${data.github ? `
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div style="flex:1; min-width:200px;">
                <span style="font-size:0.8rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.5px; display:block;">GitHub Repository URL:</span>
                <a href="${data.github}" target="_blank" rel="noopener" style="color:#60a5fa; font-size:0.95rem; font-weight:700; word-break:break-all; text-decoration:underline;">${data.github}</a>
              </div>
              <a href="${data.github}" target="_blank" rel="noopener" class="btn btn-primary" style="padding:10px 20px; font-size:0.9rem; font-weight:700; background:#2563eb; color:#fff; display:inline-flex; align-items:center; gap:8px; border-radius:8px; text-decoration:none;">
                <svg class="icon-svg brand-github" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path><path d="M9 18c-4.51 2-5-2-7-2"></path></svg>
                Open GitHub ↗
              </a>
            </div>
          ` : ''}
          ${data.live ? `
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div style="flex:1; min-width:200px;">
                <span style="font-size:0.8rem; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.5px; display:block;">Live Website Visit URL:</span>
                <a href="${data.live}" target="_blank" rel="noopener" style="color:#34d399; font-size:0.95rem; font-weight:700; word-break:break-all; text-decoration:underline;">${data.live}</a>
              </div>
              <a href="${data.live}" target="_blank" rel="noopener" class="btn btn-primary" style="padding:10px 20px; font-size:0.9rem; font-weight:700; background:linear-gradient(135deg, #10b981, #059669); color:#fff; display:inline-flex; align-items:center; gap:8px; border-radius:8px; text-decoration:none; box-shadow:0 4px 15px rgba(16,185,129,0.4);">
                <i data-lucide="external-link"></i>
                Live Visit ↗
              </a>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    projectModalBody.innerHTML = `
      <div class="p-modal-header">
        <span class="badge blue">${data.category}</span>
        <h2 style="margin-top:10px; font-size:1.8rem; font-family:var(--font-heading); color:var(--text-main);">${data.title}</h2>
      </div>
      ${actionsHtml}
      <div style="margin:20px 0;">
        <p style="color: var(--text-muted); font-size:1.05rem;">${data.desc}</p>
      </div>
      <div style="margin-bottom:20px;">
        <h4 style="color:var(--mario-yellow); margin-bottom:8px; font-family:var(--font-heading);">Key Features</h4>
        <ul style="list-style:disc; margin-left:20px; color: var(--text-muted); line-height:1.7;">
          ${data.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
      <div>
        <h4 style="color:var(--mario-blue); margin-bottom:8px; font-family:var(--font-heading);">Tech Stack</h4>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${data.tech.map(t => `<span class="skill-pill">${t}</span>`).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    projectModal.classList.remove('hidden');
    const modalContent = projectModal.querySelector('.modal-content');
    if (modalContent) modalContent.scrollTop = 0;
    if (window.soundEngine) window.soundEngine.playCoin();
  };

  document.querySelectorAll('.btn-project-details').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const projKey = btn.getAttribute('data-project');
      window.openProjectDetailsModal(projKey);
    });
  });

  if (projectModalCloseBtn) {
    projectModalCloseBtn.addEventListener('click', () => {
      projectModal.classList.add('hidden');
    });
  }

  const projectModalOverlay = projectModal ? projectModal.querySelector('.modal-overlay') : null;
  if (projectModalOverlay) {
    projectModalOverlay.addEventListener('click', () => {
      projectModal.classList.add('hidden');
    });
  }

  /* ------------------------------------------------------------------------
     9. Resume Modal & Print
     ------------------------------------------------------------------------ */
  const resumeModal = document.getElementById('resume-modal');
  const downloadResumeBtn = document.getElementById('download-resume-btn');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const printResumeBtn = document.getElementById('print-resume-btn');

  if (downloadResumeBtn) {
    downloadResumeBtn.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playCoin();
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => {
      resumeModal.classList.add('hidden');
    });
  }

  const resumeModalOverlay = resumeModal ? resumeModal.querySelector('.modal-overlay') : null;
  if (resumeModalOverlay) {
    resumeModalOverlay.addEventListener('click', () => {
      resumeModal.classList.add('hidden');
    });
  }

  if (printResumeBtn) {
    printResumeBtn.addEventListener('click', () => {
      window.print();
    });
  }

  /* ------------------------------------------------------------------------
     10. Contact Form (EmailJS) & Copy Email
     ------------------------------------------------------------------------ */
  const EMAILJS_SERVICE_ID = 'service_8r94r1g';
  const EMAILJS_TEMPLATE_ID = 'template_qe2l93x';
  const EMAILJS_PUBLIC_KEY = 'ro8Dm-tq-EOmSxUW2';

  // Initialize EmailJS SDK if available
  if (window.emailjs) {
    try {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    } catch (e) {
      console.warn('EmailJS initialization warning:', e);
    }
  }

  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');
  const formError = document.getElementById('form-error');
  const formErrorText = document.getElementById('form-error-text');
  const submitBtn = document.getElementById('contact-submit-btn');
  const submitBtnText = document.getElementById('btn-submit-text');
  const sendAnotherBtn = document.getElementById('send-another-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('name');
      const emailInput = document.getElementById('email');
      const subjectInput = document.getElementById('subject');
      const messageInput = document.getElementById('message');

      const nameVal = nameInput ? nameInput.value.trim() : '';
      const emailVal = emailInput ? emailInput.value.trim() : '';
      const subjectVal = subjectInput ? subjectInput.value.trim() : '';
      const messageVal = messageInput ? messageInput.value.trim() : '';

      if (!nameVal || !emailVal || !messageVal) {
        alert('Please fill out all required fields.');
        return;
      }

      // Sync hidden alias inputs if present
      const hiddenFromName = document.getElementById('hidden_from_name');
      const hiddenFromEmail = document.getElementById('hidden_from_email');
      const hiddenReplyTo = document.getElementById('hidden_reply_to');
      if (hiddenFromName) hiddenFromName.value = nameVal;
      if (hiddenFromEmail) hiddenFromEmail.value = emailVal;
      if (hiddenReplyTo) hiddenReplyTo.value = emailVal;

      // Enter loading state
      if (submitBtn) submitBtn.disabled = true;
      if (submitBtnText) submitBtnText.innerHTML = '<span class="spinner"></span> Sending...';
      if (formError) formError.classList.add('hidden');
      if (window.soundEngine) window.soundEngine.playCoin();

      // Parameters mapped to match all common EmailJS template variable names
      const templateParams = {
        name: nameVal,
        from_name: nameVal,
        user_name: nameVal,
        email: emailVal,
        from_email: emailVal,
        reply_to: emailVal,
        user_email: emailVal,
        subject: subjectVal || 'New message from Portfolio',
        title: subjectVal || 'Portfolio Contact',
        message: messageVal,
        time: new Date().toLocaleString()
      };

      const sendPromise = (window.emailjs && window.emailjs.send)
        ? emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY)
        : Promise.reject(new Error('EmailJS library is not available. Please verify network connectivity.'));

      console.log('Attempting EmailJS send with Service:', EMAILJS_SERVICE_ID, 'Template:', EMAILJS_TEMPLATE_ID);

      sendPromise
        .then((response) => {
          console.log('EmailJS Success:', response.status, response.text);
          contactForm.classList.add('hidden');
          if (formSuccess) formSuccess.classList.remove('hidden');
          triggerConfetti();
          if (window.soundEngine) {
            window.soundEngine.playJump();
            window.soundEngine.speakMario("Thank you! Message sent!");
          }
          contactForm.reset();
        })
        .catch((error) => {
          console.error('EmailJS Error:', error);
          if (formError) {
            formError.classList.remove('hidden');
            if (formErrorText) {
              const errDetail = (error && (error.text || error.message)) ? ` (${error.text || error.message})` : '';
              formErrorText.innerText = `Failed to send message${errDetail}. [Service: ${EMAILJS_SERVICE_ID}]. Please try again or reach out directly:`;
            }
            const fallbackMailto = document.getElementById('error-mailto-fallback');
            if (fallbackMailto) {
              const bodyText = `Hi Akash,\n\n${messageVal}\n\nFrom: ${nameVal}\nEmail: ${emailVal}`;
              fallbackMailto.href = `mailto:akashraj848114@gmail.com?subject=${encodeURIComponent(subjectVal || 'Portfolio Contact')}&body=${encodeURIComponent(bodyText)}`;
            }
          }
          if (window.soundEngine) {
            window.soundEngine.playBonk();
          }
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
          if (submitBtnText) submitBtnText.innerHTML = '<i data-lucide="send"></i> Send Message';
          if (window.lucide) window.lucide.createIcons();
        });
    });
  }

  if (sendAnotherBtn) {
    sendAnotherBtn.addEventListener('click', () => {
      if (formSuccess) formSuccess.classList.add('hidden');
      if (formError) formError.classList.add('hidden');
      if (contactForm) {
        contactForm.classList.remove('hidden');
        contactForm.reset();
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  const copyBtns = document.querySelectorAll('.copy-btn');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      navigator.clipboard.writeText(textToCopy).then(() => {
        btn.innerHTML = '<i data-lucide="check"></i>';
        if (window.lucide) window.lucide.createIcons();
        if (window.soundEngine) window.soundEngine.playCoin();
        setTimeout(() => {
          btn.innerHTML = '<i data-lucide="copy"></i>';
          if (window.lucide) window.lucide.createIcons();
        }, 2000);
      });
    });
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
      if (window.soundEngine) window.soundEngine.playCoin();
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
      });
    });
  }

  /* ------------------------------------------------------------------------
     11. Phone Mode / Desktop Mode Switcher
     ------------------------------------------------------------------------ */
  const viewModeBtn = document.getElementById('view-mode-btn');
  const viewModeIcon = document.getElementById('view-mode-icon');
  const viewModeLabel = document.getElementById('view-mode-label');

  function updateModeUI(mode) {
    const isPhone = mode === 'phone';
    if (isPhone) {
      document.body.classList.add('forced-phone-mode');
      if (viewModeLabel) viewModeLabel.textContent = 'Desktop Mode';
      if (viewModeIcon) viewModeIcon.setAttribute('data-lucide', 'monitor');
      if (viewModeBtn) viewModeBtn.setAttribute('aria-pressed', 'true');
    } else {
      document.body.classList.remove('forced-phone-mode');
      if (viewModeLabel) viewModeLabel.textContent = 'Phone Mode';
      if (viewModeIcon) viewModeIcon.setAttribute('data-lucide', 'smartphone');
      if (viewModeBtn) viewModeBtn.setAttribute('aria-pressed', 'false');
    }

    if (window.lucide) window.lucide.createIcons();

    if (window.mario3D && typeof window.mario3D.onViewModeChanged === 'function') {
      window.mario3D.onViewModeChanged(isPhone || window.innerWidth < 768);
    }
  }

  function toggleViewMode() {
    const isCurrentlyPhone = document.body.classList.contains('forced-phone-mode') || (window.innerWidth < 768 && !localStorage.getItem('akash_view_mode_preference'));
    const nextMode = isCurrentlyPhone ? 'desktop' : 'phone';
    localStorage.setItem('akash_view_mode_preference', nextMode);
    updateModeUI(nextMode);
    if (window.soundEngine) window.soundEngine.playCoin();
  }

  if (viewModeBtn) {
    viewModeBtn.addEventListener('click', toggleViewMode);
  }

  // Auto-detect on load
  const savedPref = localStorage.getItem('akash_view_mode_preference');
  if (savedPref) {
    updateModeUI(savedPref);
  } else if (window.innerWidth < 768) {
    updateModeUI('phone');
  } else {
    updateModeUI('desktop');
  }

  // Confetti helper
  function triggerConfetti() {
    if (window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e52521', '#0099ff', '#fbd000', '#43b047']
      });
    }
  }
});
