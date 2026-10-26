// Aplicativo (PWA): registra o service worker e convida a instalar o Verbum Graecum no celular.
(function () {
  if ('serviceWorker' in navigator) {
    addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) return;

  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var dispensado = 0;
  try { dispensado = +localStorage.getItem('vg-app-dispensa') || 0; } catch (e) {}
  if (Date.now() - dispensado < 30 * 864e5) return;

  var pedido = null;
  addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); pedido = e; agendar(); });
  if (ios && /Mobile|iPad/.test(ua)) agendar();

  var agendado = false;
  function agendar() {
    if (agendado) return; agendado = true;
    setTimeout(function esperar() {
      var aviso = document.getElementById('aviso');
      if (aviso && !aviso.hidden) return setTimeout(esperar, 1500);   // não sobrepor o aviso de novidades
      mostrar();
    }, 4000);
  }

  function dispensar(el) {
    el.remove();
    try { localStorage.setItem('vg-app-dispensa', String(Date.now())); } catch (e) {}
  }

  function mostrar() {
    if (document.getElementById('appAviso')) return;
    var el = document.createElement('div');
    el.className = 'aviso'; el.id = 'appAviso'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-labelledby', 'appTit');
    var corpo = ios
      ? '<p>Instale o Verbum Graecum na tela de início do seu iPhone ou iPad:</p><ol class="app-passos">' +
        '<li>No <b>Safari</b>, toque em <b>Compartilhar</b> <span class="app-ico" aria-hidden="true">⇧</span></li>' +
        '<li>Escolha <b>Adicionar à Tela de Início</b></li><li>Toque em <b>Adicionar</b></li></ol>'
      : '<p>Instale o Verbum Graecum no seu aparelho: ele abre em tela cheia, como um aplicativo, e os livros já lidos ficam disponíveis mesmo sem internet.</p>';
    var botoes = ios
      ? '<button class="btn" type="button" data-app-fechar>Entendi</button>'
      : '<button class="btn" type="button" data-app-fechar>Agora não</button> <button class="btn btn-ouro-app" type="button" data-app-instalar>Instalar</button>';
    el.innerHTML = '<div class="aviso-cab"><h2 id="appTit">Verbum Graecum no celular</h2>' +
      '<button class="aviso-x" type="button" data-app-fechar aria-label="Fechar">×</button></div>' + corpo +
      '<p class="aviso-acoes">' + botoes + '</p>';
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-app-fechar]')) dispensar(el);
      if (e.target.closest('[data-app-instalar]') && pedido) {
        pedido.prompt();
        pedido.userChoice.then(function () { pedido = null; dispensar(el); });
      }
    });
    var css = document.createElement('style');
    css.textContent = '.app-passos{margin:0 0 6px;padding-left:1.3em;display:grid;gap:3px}.app-passos li::marker{color:var(--accent)}' +
      '.app-ico{display:inline-block;border:1px solid var(--line-2);border-radius:3px;padding:0 4px;font-size:.85em;line-height:1.3}' +
      '#appAviso .aviso-acoes{gap:8px}.btn-ouro-app{border-color:var(--accent)!important;color:var(--accent)!important}';
    document.head.appendChild(css);
    document.body.appendChild(el);
  }
})();
