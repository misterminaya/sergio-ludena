/* =====================================================================
   Sergio Ludeña Visalot — JavaScript principal (vanilla, sin dependencias)
   Módulos: header compacto, menú móvil, scrollspy, acordeones,
   validación del formulario, revelado sutil, año del footer.
   Todo degrada sin JS: el contenido es accesible con la hoja de estilos.
   ===================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 1. Header fijo que se compacta ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- 2. Menú móvil accesible ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var closeNav = function (returnFocus) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (returnFocus) toggle.focus();
    };
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      nav.classList.toggle('is-open', !open);
      toggle.setAttribute('aria-expanded', String(!open));
      if (!open) {
        var first = nav.querySelector('a');
        if (first) first.focus();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeNav(true);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav(false);
    });
    document.addEventListener('click', function (e) {
      if (toggle.getAttribute('aria-expanded') === 'true' && !header.contains(e.target)) closeNav(false);
    });
  }

  /* ---------- 3. Sección activa en la landing + página actual ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav__link[data-section]'));
  var sections = navLinks
    .map(function (link) { return document.getElementById(link.getAttribute('data-section')); })
    .filter(Boolean);

  var setActive = function (id) {
    navLinks.forEach(function (link) {
      var active = link.getAttribute('data-section') === id;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  if (sections.length) {
    // La sección activa es la última cuyo inicio ya pasó la línea de lectura (40 % del viewport).
    var ticking = false;
    var updateActive = function () {
      ticking = false;
      var line = window.scrollY + window.innerHeight * 0.4;
      var current = sections[0].id;
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].offsetTop <= line) current = sections[i].id;
      }
      // Al llegar al final de la página, activa la última sección.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = sections[sections.length - 1].id;
      }
      setActive(current);
    };
    var requestUpdate = function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateActive); }
    };
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    updateActive();
  } else {
    // Fuera de la landing: marca como página actual el enlace de la sección de blog (Opinión).
    var path = window.location.pathname.split('/').pop() || '';
    document.querySelectorAll('.site-nav__link[data-page]').forEach(function (link) {
      if (path.indexOf(link.getAttribute('data-page')) === 0) link.setAttribute('aria-current', 'page');
    });
  }

  /* ---------- 4. Acordeones (button + aria-expanded + aria-controls) ----------
     Apertura animada: el panel pierde [hidden], en el siguiente frame recibe .is-open
     (grid-template-rows 0fr → 1fr). Al cerrar, espera el fin de la transición para ocultar. */
  document.querySelectorAll('.accordion__trigger').forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    var item = btn.closest('.accordion__item');

    var open = function () {
      btn.setAttribute('aria-expanded', 'true');
      if (item) item.classList.add('is-open');
      panel.hidden = false;
      if (reduceMotion.matches) { panel.classList.add('is-open'); return; }
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { panel.classList.add('is-open'); });
      });
    };

    var close = function () {
      btn.setAttribute('aria-expanded', 'false');
      if (item) item.classList.remove('is-open');
      panel.classList.remove('is-open');
      if (reduceMotion.matches) { panel.hidden = true; return; }
      var onEnd = function (e) {
        if (e.target !== panel) return;
        panel.removeEventListener('transitionend', onEnd);
        if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true;
      };
      panel.addEventListener('transitionend', onEnd);
      // Respaldo por si el navegador no dispara transitionend
      window.setTimeout(function () {
        if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true;
      }, 450);
    };

    btn.addEventListener('click', function () {
      if (btn.getAttribute('aria-expanded') === 'true') close(); else open();
    });
  });

  /* ---------- 5. Validación accesible del formulario de contacto ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('.form__status');
    var fields = Array.prototype.slice.call(form.querySelectorAll('[data-validate]'));
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var messages = {
      required: 'Este campo es obligatorio.',
      email: 'Escribe un correo electrónico válido, por ejemplo nombre@dominio.com.',
      minlength: 'El mensaje debe tener al menos 20 caracteres.'
    };

    var validateField = function (field) {
      var error = document.getElementById(field.getAttribute('aria-describedby'));
      var value = field.value.trim();
      var msg = '';
      if (field.required && !value) msg = messages.required;
      else if (field.type === 'email' && value && !emailRe.test(value)) msg = messages.email;
      else if (field.minLength > 0 && value && value.length < field.minLength) msg = messages.minlength;

      if (error) {
        error.textContent = msg;
        error.classList.toggle('is-visible', Boolean(msg));
      }
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    };

    fields.forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault(); // El envío real se resuelve en WordPress (wp_mail o plugin)
      var invalid = fields.filter(function (f) { return !validateField(f); });

      status.hidden = false;
      status.className = 'form__status';
      if (invalid.length) {
        status.classList.add('form__status--error');
        status.textContent = invalid.length === 1
          ? 'Revisa el campo marcado antes de enviar.'
          : 'Revisa los ' + invalid.length + ' campos marcados antes de enviar.';
        invalid[0].focus();
        return;
      }
      status.classList.add('form__status--success');
      status.textContent = 'Formulario validado. En el sitio final el mensaje se enviará a contacto@sergioludena.com.';
      form.reset();
      fields.forEach(function (f) { f.removeAttribute('aria-invalid'); });
    });
  }

  /* ---------- 6. Revelado sutil al hacer scroll (solo si no se reduce el movimiento) ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- 7. Año en el footer ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
