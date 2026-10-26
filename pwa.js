// Aplicativo (PWA): registra o service worker, convida a instalar o Verbum Graecum
// e liga os botões “Baixe o Aplicativo” (que abrem as instruções a qualquer momento).
(function () {
  if ('serviceWorker' in navigator) {
    addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var android = /Android/i.test(ua);
  var celular = ios || android || /Mobile/i.test(ua);
  var pedido = null;

  addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); pedido = e;
    var el = document.getElementById('appAviso');
    if (el) el.dataset.atualizar = '1', mostrar(true);   // atualiza a janela aberta com o botão Instalar
    else agendar();
  });
  addEventListener('appinstalled', function () {
    pedido = null;
    var el = document.getElementById('appAviso'); if (el) el.remove();
    botoes(false);
  });

  // Botões “Baixe o Aplicativo”: aparecem só no site público e somem dentro do aplicativo instalado.
  function botoes(ver) {
    document.querySelectorAll('[data-app]').forEach(function (b) { b.hidden = !ver; });
  }
  function ligar() {
    botoes(!standalone);
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('[data-app]')) { e.preventDefault(); mostrar(true); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ligar); else ligar();

  if (standalone) return;

  // Convite automático, uma vez a cada 30 dias, só no celular.
  var dispensado = 0;
  try { dispensado = +localStorage.getItem('vg-app-dispensa') || 0; } catch (e) {}
  var podeConvidar = Date.now() - dispensado >= 30 * 864e5;
  var agendado = false;
  function agendar() {
    if (agendado || !podeConvidar || !celular) return; agendado = true;
    setTimeout(function esperar() {
      var aviso = document.getElementById('aviso');
      if (aviso && !aviso.hidden) return setTimeout(esperar, 1500);   // não sobrepor o aviso de novidades
      mostrar(false);
    }, 4000);
  }
  if (ios) agendar();

  function dispensar(el, lembrar) {
    el.remove();
    if (lembrar) try { localStorage.setItem('vg-app-dispensa', String(Date.now())); } catch (e) {}
  }

  var PASSOS_IOS = '<ol class="app-passos"><li>Abra o site no <b>Safari</b></li>' +
    '<li>Toque em <b>Compartilhar</b> <span class="app-ico" aria-hidden="true">⇧</span></li>' +
    '<li>Escolha <b>Adicionar à Tela de Início</b> e toque em <b>Adicionar</b></li></ol>';
  var PASSOS_ANDROID = '<ol class="app-passos"><li>Abra o site no <b>Chrome</b></li>' +
    '<li>Toque no menu <b>⋮</b> (canto superior direito)</li>' +
    '<li>Escolha <b>Instalar aplicativo</b> (ou <b>Adicionar à tela inicial</b>)</li></ol>';
  var PASSOS_PC = '<ol class="app-passos"><li>Abra o site no <b>Chrome</b> ou no <b>Edge</b></li>' +
    '<li>Clique no ícone de instalar <span class="app-ico" aria-hidden="true">⊕</span> na barra de endereço (ou, no menu, em <b>Instalar Verbum Graecum</b>)</li></ol>';

  function conteudo() {
    var intro = '<p>Instale o Verbum Graecum no seu aparelho: ele abre em tela cheia, como um aplicativo, e os livros já lidos ficam disponíveis mesmo sem internet. É gratuito e não precisa de loja de aplicativos.</p>';
    if (pedido) return intro + '<p class="app-dica">Toque em <b>Instalar</b> para adicionar o aplicativo.</p>';
    if (ios) return intro + '<p class="app-sub">No iPhone e no iPad:</p>' + PASSOS_IOS;
    if (android) return intro + '<p class="app-sub">No Android:</p>' + PASSOS_ANDROID;
    return intro +
      '<p class="app-sub">No celular Android</p>' + PASSOS_ANDROID +
      '<p class="app-sub">No iPhone e no iPad</p>' + PASSOS_IOS +
      '<p class="app-sub">No computador</p>' + PASSOS_PC;
  }

  var cssPronto = false;
  function css() {
    if (cssPronto) return; cssPronto = true;
    var c = document.createElement('style');
    c.textContent = '.app-passos{margin:0 0 8px;padding-left:1.3em;display:grid;gap:3px}.app-passos li::marker{color:var(--accent)}' +
      '.app-ico{display:inline-block;border:1px solid var(--line-2);border-radius:3px;padding:0 4px;font-size:.85em;line-height:1.3}' +
      '.app-sub{margin:10px 0 4px!important;font-variant-caps:all-small-caps;letter-spacing:.08em;color:var(--accent)}' +
      '#appAviso .aviso-acoes{gap:8px}.btn-app-inst{background:var(--accent)!important;border-color:var(--accent)!important;color:var(--bg)!important}' +
      '#appAviso.app-cheio{z-index:41;max-height:calc(100vh - 40px)}';
    document.head.appendChild(c);
  }

  function mostrar(forcado) {
    css();
    var antigo = document.getElementById('appAviso');
    if (antigo && !antigo.dataset.atualizar) { antigo.querySelector('button').focus(); return; }
    if (antigo) antigo.remove();
    var el = document.createElement('div');
    el.className = 'aviso' + (forcado ? ' app-cheio' : '');
    el.id = 'appAviso'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-labelledby', 'appTit');
    if (forcado) el.dataset.forcado = '1';
    var botoesHtml = pedido
      ? '<button class="btn" type="button" data-app-fechar>Agora não</button> <button class="btn btn-app-inst" type="button" data-app-instalar>Instalar</button>'
      : '<button class="btn" type="button" data-app-fechar>Entendi</button>';
    el.innerHTML = '<div class="aviso-cab"><h2 id="appTit">Baixe o aplicativo Verbum Graecum</h2>' +
      '<button class="aviso-x" type="button" data-app-fechar aria-label="Fechar">×</button></div>' + conteudo() +
      '<p class="aviso-acoes">' + botoesHtml + '</p>';
    el.addEventListener('click', function (e) {
      if (e.target.closest('[data-app-fechar]')) dispensar(el, !el.dataset.forcado);
      if (e.target.closest('[data-app-instalar]') && pedido) {
        pedido.prompt();
        pedido.userChoice.then(function () { pedido = null; dispensar(el, true); });
      }
    });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') dispensar(el, !el.dataset.forcado); });
    document.body.appendChild(el);
    if (forcado) { var b = el.querySelector('[data-app-instalar]') || el.querySelector('.aviso-acoes .btn'); if (b) b.focus(); }
  }
})();
