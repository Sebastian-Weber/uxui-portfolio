/*
 * consent.js: zentrales PostHog-Setup und Einwilligungsbanner für alle Portfolio-Seiten.
 *
 * Einbinden im <head>, VOR allen Skripten, die posthog.capture() aufrufen:
 *   <script src="https://sebastian-weber.github.io/uxui-portfolio/consent.js"></script>
 *
 * Erfasst wird erst nach Zustimmung (opt_out_capturing_by_default).
 * Die Bannersprache folgt dem lang-Attribut von <html> und wechselt automatisch mit.
 * Ein Link mit id="cookie-settings-link" öffnet den Banner erneut (Art. 7 Abs. 3 DSGVO).
 */
(function () {
  if (window.__swConsentLoaded) return;
  window.__swConsentLoaded = true;

  var PRIVACY_URL = 'https://sebastian-weber.github.io/uxui-portfolio/datenschutz.html#posthog';

  var TEXT = {
    de: {
      title: 'Hilf mir, die UX meines Portfolios zu verbessern',
      body: 'Wer an Einstellungsprozessen beteiligt ist, sichtet viele Bewerbungen und hat kaum Zeit für Rückmeldungen. Das verstehe ich. Deshalb möchte ich sehen, wie Du mein Portfolio nutzt: was Du öffnest, wie weit Du liest, wo Du abspringst. Dafür setze ich Cookies und zeichne Deine Sitzung mit PostHog auf, Eingaben bleiben verborgen. Deine Daten nutze ich nicht kommerziell.',
      privacy: 'Details zu Cookies und PostHog',
      decline: 'Nein, danke',
      accept: 'Ja, gerne'
    },
    en: {
      title: 'Help me improve the UX of my portfolio',
      body: 'Anyone involved in hiring reviews many applications and has little time to give feedback. I understand that. That’s why I’d like to see how you use my portfolio: what you open, how far you read, where you leave. To do this, I use cookies and record your session with PostHog, and anything you type stays hidden. I don’t use your data for commercial purposes.',
      privacy: 'Details on cookies and PostHog',
      decline: 'No, thanks',
      accept: 'Yes, happy to'
    }
  };

  /* ---------- PostHog ---------- */
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog && window.posthog.__loaded)||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="Pn On init Wn Qn ki Gn Kn zn capture calculateEventProperties rs register register_once register_for_session unregister unregister_for_session os getFeatureFlag getFeatureFlagPayload getFeatureFlagResult isFeatureEnabled reloadFeatureFlags updateFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey displaySurvey cancelPendingSurvey canRenderSurvey canRenderSurveyAsync ls identify setPersonProperties unsetPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset setIdentity clearIdentity get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException addExceptionStep captureLog startExceptionAutocapture stopExceptionAutocapture loadToolbar get_property getSessionProperty ns es createPersonProfile setInternalOrTestUser ss Hn cs opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing get_explicit_consent_status is_capturing clear_opt_in_out_capturing Yn debug Ci gr getPageViewId captureTraceFeedback captureTraceMetric qn".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  var phLoaded = false;

  posthog.init('phc_ozweFkkTr9KtcQmuiTQHfjf3CiFv2hE2dKqwszmWutKv', {
    api_host: 'https://eu.i.posthog.com',
    defaults: '2026-05-30',
    person_profiles: 'identified_only',
    opt_out_capturing_by_default: true,
    session_recording: {
      maskAllInputs: true
    },
    loaded: function () {
      phLoaded = true;
      showIfPending();
    }
  });

  /* ---------- Banner ---------- */
  var banner = null;
  var els = {};

  function currentLang() {
    var l = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    if (l.indexOf('de') === 0) return 'de';
    if (l.indexOf('en') === 0) return 'en';
    try {
      var s = localStorage.getItem('portfolio-lang');
      if (s === 'de' || s === 'en') return s;
    } catch (e) {}
    return 'en';
  }

  function injectStyles() {
    if (document.getElementById('swc-style')) return;
    var css =
      '#cookie-banner.swc{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);' +
        'flex-direction:column;align-items:stretch;gap:12px;' +
        'width:calc(100% - 32px);max-width:560px;padding:20px 24px;border-radius:12px;' +
        'background:#0F1117;color:#fff;box-shadow:0 8px 32px rgba(0,0,0,.18);' +
        'z-index:2147483000;font-family:inherit;font-size:13px;line-height:1.5;text-align:left;box-sizing:border-box}' +
      '#cookie-banner.swc .swc-title{margin:0;color:#fff;font-size:14px;font-weight:700;line-height:1.35}' +
      '#cookie-banner.swc .swc-text{margin:0;flex:none;color:#ccc;font-size:13px;line-height:1.5}' +
      '#cookie-banner.swc .swc-text a{color:#fff;text-decoration:underline}' +
      '#cookie-banner.swc .swc-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}' +
      '#cookie-banner.swc .swc-btn{font-family:inherit;font-size:12px;font-weight:600;line-height:1.2;' +
        'padding:9px 16px;border-radius:7px;border:1px solid #fff;background:#fff;color:#0F1117;' +
        'cursor:pointer;white-space:nowrap;margin:0}' +
      '#cookie-banner.swc .swc-btn:hover{background:#E0DEDA;border-color:#E0DEDA}' +
      '#cookie-banner.swc .swc-btn:focus-visible{outline:2px solid #fff;outline-offset:2px}' +
      '@media (max-width:480px){#cookie-banner.swc{bottom:16px;padding:16px}' +
        '#cookie-banner.swc .swc-actions{justify-content:stretch}' +
        '#cookie-banner.swc .swc-btn{flex:1 1 0}}';
    var style = document.createElement('style');
    style.id = 'swc-style';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  }

  function renderText() {
    if (!banner) return;
    var t = TEXT[currentLang()];
    els.title.textContent = t.title;
    els.body.textContent = t.body + ' ';
    els.link.textContent = t.privacy;
    els.body.appendChild(els.link);
    els.decline.textContent = t.decline;
    els.accept.textContent = t.accept;
  }

  function buildBanner() {
    if (banner) return;
    var existing = document.getElementById('cookie-banner');
    if (existing) existing.parentNode.removeChild(existing);

    injectStyles();

    banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'swc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'swc-title');
    banner.style.display = 'none';

    els.title = document.createElement('p');
    els.title.id = 'swc-title';
    els.title.className = 'swc-title';

    els.body = document.createElement('p');
    els.body.className = 'swc-text';

    els.link = document.createElement('a');
    els.link.href = PRIVACY_URL;
    els.link.target = '_blank';
    els.link.rel = 'noopener';

    var actions = document.createElement('div');
    actions.className = 'swc-actions';

    els.decline = document.createElement('button');
    els.decline.type = 'button';
    els.decline.className = 'swc-btn';
    els.decline.addEventListener('click', function () { decide(false); });

    els.accept = document.createElement('button');
    els.accept.type = 'button';
    els.accept.className = 'swc-btn';
    els.accept.addEventListener('click', function () { decide(true); });

    actions.appendChild(els.decline);
    actions.appendChild(els.accept);
    banner.appendChild(els.title);
    banner.appendChild(els.body);
    banner.appendChild(actions);
    document.body.appendChild(banner);

    renderText();

    if (window.MutationObserver) {
      new MutationObserver(renderText).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['lang']
      });
    }
  }

  function show() {
    buildBanner();
    banner.style.display = 'flex';
  }

  function hide() {
    if (banner) banner.style.display = 'none';
  }

  function showIfPending() {
    if (!phLoaded || !document.body) return;
    try {
      if (posthog.get_explicit_consent_status() === 'pending') show();
    } catch (e) {}
  }

  function decide(accepted) {
    hide();
    if (accepted) {
      posthog.opt_in_capturing();
      posthog.capture('cookie_consent', { accepted: true });
    } else {
      posthog.opt_out_capturing();
    }
  }

  function onReady() {
    buildBanner();
    showIfPending();
    var settings = document.getElementById('cookie-settings-link');
    if (settings) {
      settings.addEventListener('click', function (e) {
        e.preventDefault();
        show();
      });
    }
  }

  window.swConsent = { open: show, decide: decide };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
