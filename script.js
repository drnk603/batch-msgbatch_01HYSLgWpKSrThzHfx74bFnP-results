(function() {
  'use strict';

  const app = {
    state: {
      burgerOpen: false,
      scrollPosition: 0,
      isSubmitting: false
    }
  };

  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function throttle(fn, limit) {
    let waiting = false;
    return function(...args) {
      if (!waiting) {
        fn.apply(this, args);
        waiting = true;
        setTimeout(() => { waiting = false; }, limit);
      }
    };
  }

  function escapeHTML(str) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return String(str).replace(/[&<>"'/]/g, char => map[char]);
  }

  function showNotification(message, type = 'info') {
    let container = document.getElementById('js-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'js-toast-container';
      container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:10000;max-width:350px;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `${escapeHTML(message)}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>`;
    
    container.appendChild(toast);

    const closeBtn = toast.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 150);
      });
    }

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 150);
    }, 5000);
  }

  function initBurgerMenu() {
    const toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
    const nav = document.querySelector('.c-nav, #mainNav');
    const navCollapse = document.querySelector('.navbar-collapse');
    
    if (!toggle || !navCollapse) return;

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      
      toggle.setAttribute('aria-expanded', !isExpanded);
      
      if (isExpanded) {
        navCollapse.classList.remove('show');
        document.body.classList.remove('u-no-scroll');
        app.state.burgerOpen = false;
      } else {
        navCollapse.classList.add('show');
        document.body.classList.add('u-no-scroll');
        app.state.burgerOpen = true;
      }
    });

    document.addEventListener('click', (e) => {
      if (app.state.burgerOpen && nav && !nav.contains(e.target) && !toggle.contains(e.target)) {
        toggle.setAttribute('aria-expanded', 'false');
        navCollapse.classList.remove('show');
        document.body.classList.remove('u-no-scroll');
        app.state.burgerOpen = false;
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && app.state.burgerOpen) {
        toggle.setAttribute('aria-expanded', 'false');
        navCollapse.classList.remove('show');
        document.body.classList.remove('u-no-scroll');
        app.state.burgerOpen = false;
        toggle.focus();
      }
    });

    const navLinks = navCollapse.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (app.state.burgerOpen) {
          toggle.setAttribute('aria-expanded', 'false');
          navCollapse.classList.remove('show');
          document.body.classList.remove('u-no-scroll');
          app.state.burgerOpen = false;
        }
      });
    });

    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth >= 1024 && app.state.burgerOpen) {
        toggle.setAttribute('aria-expanded', 'false');
        navCollapse.classList.remove('show');
        document.body.classList.remove('u-no-scroll');
        app.state.burgerOpen = false;
      }
    }, 250));
  }

  function initSmoothScroll() {
    const isHomepage = window.location.pathname === '/' || 
                       window.location.pathname.endsWith('/index.html');

    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      if (!isHomepage) return;

      const targetId = href.substring(1);
      const targetSection = document.getElementById(targetId);
      if (!targetSection) return;

      e.preventDefault();

      const header = document.querySelector('.l-header');
      const headerHeight = header ? header.offsetHeight : 64;
      const targetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  }

  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    if (sections.length === 0 || navLinks.length === 0) return;

    const observerCallback = throttle(() => {
      let currentSection = '';

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const scrollPos = window.pageYOffset + 100;

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          currentSection = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
        
        const href = link.getAttribute('href');
        if (href === `#${currentSection}`) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
      });
    }, 100);

    window.addEventListener('scroll', observerCallback, { passive: true });
  }

  function initActiveMenuState() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
      link.classList.remove('active');
      link.removeAttribute('aria-current');

      const linkPath = new URL(link.href, window.location.origin).pathname;

      if (currentPath === linkPath || 
          (currentPath === '/' && linkPath.endsWith('/index.html')) ||
          (currentPath.endsWith('/index.html') && linkPath === '/')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function initLazyImages() {
    const images = document.querySelectorAll('img:not([loading])');
    
    images.forEach(img => {
      const isCritical = img.classList.contains('c-logo__img') || 
                        img.closest('.l-header') || 
                        img.hasAttribute('data-critical');
      
      if (!isCritical) {
        img.setAttribute('loading', 'lazy');
      }
    });

    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('error', function() {
        const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e9ecef" width="400" height="300"/%3E%3Ctext fill="%236c757d" font-family="sans-serif" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EBild nicht verfügbar%3C/text%3E%3C/svg%3E';
        this.src = placeholder;
      }, { once: true });
    });
  }

  function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const id = field.id;
    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'Dieses Feld ist erforderlich.';
    } else if (value) {
      if (type === 'email' || id.toLowerCase().includes('email')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        }
      } else if (type === 'tel' || id.toLowerCase().includes('phone')) {
        const phoneRegex = /^[\d\s\+\-\(\)]{7,20}$/;
        if (!phoneRegex.test(value)) {
          isValid = false;
          errorMessage = 'Bitte geben Sie eine gültige Telefonnummer ein.';
        }
      } else if (field.tagName === 'TEXTAREA' || id.toLowerCase().includes('message')) {
        if (value.length < 10) {
          isValid = false;
          errorMessage = 'Die Nachricht muss mindestens 10 Zeichen enthalten.';
        }
      } else if (id.toLowerCase().includes('name')) {
        const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/;
        if (!nameRegex.test(value)) {
          isValid = false;
          errorMessage = 'Bitte geben Sie einen gültigen Namen ein.';
        }
      }
    }

    if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
      isValid = false;
      errorMessage = 'Bitte akzeptieren Sie die Bedingungen.';
    }

    const parentGroup = field.closest('.c-form__group, .mb-3, .mb-4');
    let errorElement = parentGroup ? parentGroup.querySelector('.c-form__error, .invalid-feedback') : null;

    if (isValid) {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      }
    } else {
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');
      
      if (!errorElement && parentGroup) {
        errorElement = document.createElement('div');
        errorElement.className = 'invalid-feedback c-form__error';
        errorElement.style.display = 'block';
        parentGroup.appendChild(errorElement);
      }
      
      if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
      }
    }

    return isValid;
  }

  function initForms() {
    const forms = document.querySelectorAll('form.c-form, form.needs-validation');

    forms.forEach(form => {
      const fields = form.querySelectorAll('input, textarea, select');
      
      fields.forEach(field => {
        field.addEventListener('blur', () => {
          if (field.value.trim() || field.classList.contains('is-invalid')) {
            validateField(field);
          }
        });

        field.addEventListener('input', () => {
          if (field.classList.contains('is-invalid')) {
            validateField(field);
          }
        });
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (app.state.isSubmitting) return;

        let isFormValid = true;
        const formData = {};

        fields.forEach(field => {
          if (!validateField(field)) {
            isFormValid = false;
          }
          
          if (field.type === 'checkbox') {
            formData[field.name || field.id] = field.checked;
          } else {
            formData[field.name || field.id] = field.value.trim();
          }
        });

        if (!isFormValid) {
          const firstInvalid = form.querySelector('.is-invalid');
          if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

        if (submitBtn) {
          submitBtn.disabled = true;
          app.state.isSubmitting = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Wird gesendet...';
        }

        const honeypotDelay = setTimeout(() => {
          fetch('/process.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              showNotification('Vielen Dank! Ihre Nachricht wurde erfolgreich gesendet.', 'success');
              form.reset();
              fields.forEach(f => {
                f.classList.remove('is-valid', 'is-invalid');
              });
              setTimeout(() => {
                window.location.href = '/thank_you.html';
              }, 1500);
            } else {
              showNotification(data.message || 'Es ist ein Fehler aufgetreten.', 'danger');
            }
          })
          .catch(() => {
            showNotification('Verbindungsfehler. Bitte versuchen Sie es später erneut.', 'danger');
          })
          .finally(() => {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalBtnText;
              app.state.isSubmitting = false;
            }
          });
        }, 500);
      });
    });
  }

  function initScrollToTop() {
    const scrollBtn = document.querySelector('[data-scroll-top], .scroll-to-top');
    if (!scrollBtn) return;

    const toggleVisibility = throttle(() => {
      if (window.pageYOffset > 300) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    }, 200);

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    scrollBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initAccordion() {
    const accordionButtons = document.querySelectorAll('.accordion-button');
    
    accordionButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetId = button.getAttribute('data-bs-target');
        if (!targetId) return;

        const targetCollapse = document.querySelector(targetId);
        if (!targetCollapse) return;

        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        const parentAccordion = button.closest('.accordion');

        if (parentAccordion) {
          const allButtons = parentAccordion.querySelectorAll('.accordion-button');
          const allCollapses = parentAccordion.querySelectorAll('.accordion-collapse');
          
          allButtons.forEach(btn => {
            btn.classList.add('collapsed');
            btn.setAttribute('aria-expanded', 'false');
          });
          
          allCollapses.forEach(collapse => {
            collapse.classList.remove('show');
          });
        }

        if (!isExpanded) {
          button.classList.remove('collapsed');
          button.setAttribute('aria-expanded', 'true');
          targetCollapse.classList.add('show');
        }
      });
    });
  }

  function initCountUp() {
    const counters = document.querySelectorAll('[data-count]');
    
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-count'), 10);
      const duration = 2000;
      const step = target / (duration / 16);
      let current = 0;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const updateCounter = () => {
              current += step;
              if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
              } else {
                counter.textContent = target;
              }
            };
            updateCounter();
            observer.unobserve(counter);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(counter);
    });
  }

  function initPrivacyModal() {
    const privacyLinks = document.querySelectorAll('a[href*="privacy"], a[href*="datenschutz"]');
    
    privacyLinks.forEach(link => {
      if (link.getAttribute('href') === '#privacy' || link.hasAttribute('data-modal')) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          showNotification('Die Datenschutzrichtlinie wird in einem neuen Fenster geöffnet.', 'info');
          window.open('/privacy.html', '_blank');
        });
      }
    });
  }

  function init() {
    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initActiveMenuState();
    initLazyImages();
    initForms();
    initScrollToTop();
    initAccordion();
    initCountUp();
    initPrivacyModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.__autokultur = app;
})();
