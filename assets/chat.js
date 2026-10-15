/* Change-request chat for the review page. A scripted conversation (no AI,
   no server): it asks one thing at a time and builds a structured prompt the
   student copies and sends to Timmy. The draft is kept in this browser. */
(function () {
  'use strict';
  var root = document.getElementById('chat');
  if (!root) return;
  var P = window.NavMap.pages;

  var B_THINGS = [
    ['plant', 'The crops in the field', '田裡的作物'], ['human-practices', 'The farmer', '農夫'],
    ['team', 'The student in the lab coat', '穿實驗衣的學生'], ['results', "The notebook in the student's hand", '學生手上的筆記本'],
    ['hardware', 'The bioreactor', '反應器'], ['software', 'The screen on the bioreactor', '反應器上的螢幕'],
    ['safety-and-security', 'The warning label on the bioreactor', '反應器上的警告標誌']
  ];
  var PARTS = [
    ['b', 'Picture B (the field edge)', 'B 田邊近景那幅畫'],
    ['w', 'The whole-wiki picture', '整個 wiki 那幅畫'],
    ['line', 'A line under the picture', '畫下方的說明文字'],
    ['brief', 'The brief for the illustrator', '給畫者的說明'],
    ['page', 'This review page', '這個討論頁'],
    ['other', 'Something else', '其他']
  ];
  var KINDS = [
    ['drawing', 'The drawing', '畫的內容'], ['wording', 'Wording', '文字'], ['behaviour', 'How it reacts (hover, tap)', '互動方式（滑鼠、點擊）'],
    ['layout', 'Layout or size', '版面或大小'], ['add', 'Add something', '加東西'], ['remove', 'Remove something', '拿掉東西'], ['other', 'Other', '其他']
  ];
  var PRIORITY = [['must', 'Must have', '一定要'], ['nice', 'Nice to have', '有更好'], ['idea', 'Just an idea', '只是想法']];
  var T = {
    hello: ['Hi! Tell me what you would change and I will turn it into a clear request for Timmy. First, what is your name?', '嗨！告訴我你想改什麼，我會把它整理成給 Timmy 的清楚請求。先說說你的名字？'],
    part: ['Thanks, {name}. Which part is this about?', '謝謝，{name}。這是關於哪個部分？'],
    thingB: ['Which thing in the picture?', '畫裡的哪樣東西？'],
    thingW: ['Which page’s object? Pick one, or the whole picture.', '哪一頁的東西？選一個，或選整幅畫。'],
    thingL: ['Which page’s line?', '哪一頁的說明？'],
    kind: ['What kind of change?', '是哪一種修改？'],
    what: ['Describe the change. Say what it is now and what it should be, as exactly as you can.', '描述這個修改。盡量具體地說：現在是什麼樣子，應該改成什麼樣子。'],
    more: ['Could you say a little more? For example: "The farmer’s hat is too big. Make it about half the size."', '可以再多說一點嗎？例如：「農夫的帽子太大了，改成大概一半大。」'],
    why: ['Why? It helps Timmy get it right. (You can skip this.)', '為什麼？這能幫 Timmy 改得更準。（可以跳過）'],
    prio: ['How important is it?', '這有多重要？'],
    added: ['Got it, that is change {n}. Another one, or are you done?', '收到，這是第 {n} 個修改。還有別的嗎，還是完成了？'],
    notes: ['Anything else Timmy should know? (You can skip this.)', '還有什麼要讓 Timmy 知道的嗎？（可以跳過）'],
    done: ['Done. Your prompt is ready on the right: copy it and send it to Timmy.', '完成。右邊的提示已經準備好了：複製後傳給 Timmy。'],
    another: ['Add another change', '再加一個修改'], finish: ['I’m done', '完成了'], skip: ['Skip', '跳過'],
    whole: ['The whole picture', '整幅畫'],
    allLines: ['All of them', '全部'],
    ph: ['Type here, then press Enter', '在這裡輸入，按 Enter 送出'],
    copy: ['Copy prompt', '複製提示'], copied: ['Copied', '已複製'], reset: ['Start over', '重新開始'],
    empty: ['Your prompt will build here as you answer.', '你回答的同時，提示會在這裡逐步完成。'],
    title: ['Prompt for Timmy', '給 Timmy 的提示']
  };
  var lang = function () { return document.documentElement.getAttribute('data-lang') === 'zh' ? 1 : 0; };
  var t = function (k, args) {
    var s = T[k][lang()];
    for (var a in args || {}) s = s.replace('{' + a + '}', args[a]);
    return s;
  };
  var label = function (list, id) { for (var i = 0; i < list.length; i++) if (list[i][0] === id) return list[i]; return null; };

  // state: the conversation log and the request being built
  var S, KEY = 'nm-chat-v1';
  function fresh() { return { log: [], step: 'name', name: '', changes: [], cur: {}, notes: '' }; }
  try { S = JSON.parse(localStorage.getItem(KEY)) || fresh(); } catch (e) { S = fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  root.innerHTML =
    '<div class="ch-talk"><div class="ch-log" aria-live="polite"></div><div class="ch-chips"></div>' +
    '<form class="ch-form"><textarea rows="2"></textarea><button type="submit" aria-label="Send">↑</button></form></div>' +
    '<div class="ch-out"><div class="ch-out-head"><strong></strong><span><button type="button" class="ch-reset"></button><button type="button" class="ch-copy"></button></span></div><pre class="ch-prompt"></pre></div>';
  var logEl = root.querySelector('.ch-log'), chipsEl = root.querySelector('.ch-chips'), form = root.querySelector('.ch-form');
  var input = form.querySelector('textarea'), out = root.querySelector('.ch-prompt');
  var copyBtn = root.querySelector('.ch-copy'), resetBtn = root.querySelector('.ch-reset');

  function bot(k, args) { S.log.push({ who: 'bot', k: k, args: args || {} }); }
  function me(text) { S.log.push({ who: 'me', text: text }); }

  function ask() {
    // what to ask for the current step
    var step = S.step;
    if (!S.log.length) bot('hello');
    if (step === 'part' && last() !== 'part') bot('part', { name: S.name });
  }
  function last() { for (var i = S.log.length - 1; i >= 0; i--) if (S.log[i].who === 'bot') return S.log[i].k; return null; }

  function chips() {
    var L = lang(), list = [];
    switch (S.step) {
      case 'part': list = PARTS.map(function (p) { return [p[0], p[1 + L]]; }); break;
      case 'thing':
        if (S.cur.part === 'w' || S.cur.part === 'line') {
          list = [['__whole', S.cur.part === 'line' ? t('allLines') : t('whole')]].concat(Object.keys(P).map(function (k) { return [k, P[k].name]; }));
        } else list = [['__whole', t('whole')]].concat(B_THINGS.map(function (b) { return [b[0], b[1 + L] + ' → ' + P[b[0]].name]; }));
        break;
      case 'kind': list = KINDS.map(function (p) { return [p[0], p[1 + L]]; }); break;
      case 'why': case 'notes': list = [['__skip', t('skip')]]; break;
      case 'prio': list = PRIORITY.map(function (p) { return [p[0], p[1 + L]]; }); break;
      case 'next': list = [['__another', t('another')], ['__finish', t('finish')]]; break;
    }
    return list;
  }

  function answer(text, id) {
    text = (text || '').trim();
    if (!text && !id) return;
    me(text || id);
    switch (S.step) {
      case 'name': S.name = text; S.step = 'part'; bot('part', { name: S.name }); break;
      case 'part':
        S.cur = { part: id || 'other', partText: id ? '' : text };
        if (S.cur.part === 'b' || S.cur.part === 'w' || S.cur.part === 'line') { S.step = 'thing'; bot(S.cur.part === 'w' ? 'thingW' : S.cur.part === 'line' ? 'thingL' : 'thingB'); }
        else { S.step = 'kind'; bot('kind'); }
        break;
      case 'thing': S.cur.thing = id || text; S.step = 'kind'; bot('kind'); break;
      case 'kind': S.cur.kind = id || 'other'; S.cur.kindText = id ? '' : text; S.step = 'what'; bot('what'); break;
      case 'what':
        if (text.length < 12 && !S.cur.what) { S.cur.what = text; bot('more'); break; }
        S.cur.what = text.length >= 12 || !S.cur.what ? text : S.cur.what + ' ' + text; S.step = 'why'; bot('why'); break;
      case 'why': S.cur.why = id === '__skip' ? '' : text; S.step = 'prio'; bot('prio'); break;
      case 'prio':
        S.cur.prio = id || 'nice'; S.changes.push(S.cur); S.cur = {}; S.step = 'next'; bot('added', { n: S.changes.length }); break;
      case 'next':
        if (id === '__finish') { S.step = 'notes'; bot('notes'); }
        else { S.step = 'part'; bot('part', { name: S.name }); }
        break;
      case 'notes': S.notes = id === '__skip' ? '' : text; S.step = 'done'; bot('done'); break;
    }
    save(); render();
  }

  function whereOf(c) {
    var part = label(PARTS, c.part), where = part ? part[1] : 'Something else';
    if (c.partText) where = c.partText;
    if (c.thing) {
      if (c.thing === '__whole') where += c.part === 'line' ? ' › every line' : ' › the whole picture';
      else if (P[c.thing] && c.part === 'line') where += ' › the ' + P[c.thing].name + ' line (navmap/navmap.js, LIST)';
      else if (P[c.thing]) {
        var b = label(B_THINGS, c.thing);
        where += ' › ' + (c.part !== 'w' && b ? b[1] + ' (opens ' + P[c.thing].name + ')' : 'the ' + P[c.thing].name + ' object');
      } else where += ' › ' + c.thing;
    }
    return where;
  }
  function prompt() {
    if (!S.name && !S.changes.length) return '';
    var d = new Date(), date = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    var lines = [];
    lines.push('Navigation picture: change request from ' + (S.name || '(name)') + ', ' + date);
    lines.push('Review page: https://timmy97-tw.github.io/releaf-navmap/');
    lines.push('Repo: Timmy97-TW/releaf-navmap (local Releaf_Wiki/releaf-navmap, built from navmap-proto/v2)');
    lines.push('');
    var all = S.changes.slice();
    if (S.cur && S.cur.what) all.push(S.cur);
    all.forEach(function (c, i) {
      var kind = label(KINDS, c.kind), pr = label(PRIORITY, c.prio);
      lines.push('Change ' + (i + 1) + (pr ? ' [' + pr[1] + ']' : ''));
      lines.push('- Where: ' + whereOf(c));
      lines.push('- Kind: ' + (c.kindText || (kind ? kind[1] : 'Other')));
      lines.push('- Change (as written): ' + (c.what || ''));
      if (c.why) lines.push('- Why (as written): ' + c.why);
      lines.push('');
    });
    if (S.notes) { lines.push('Other notes (as written): ' + S.notes); lines.push(''); }
    if (all.length) {
      lines.push('Please make these changes and keep everything else as it is. Quotes marked "as written" are the student’s own words and may be in Chinese. ' +
        'If a change is unclear or conflicts with an earlier decision, ask before doing it. Rebuild, check it in the browser, push, and tell me what changed and anything you could not do.');
    }
    return lines.join('\n');
  }

  function render() {
    var L = lang();
    logEl.innerHTML = '';
    S.log.forEach(function (m) {
      var d = document.createElement('div');
      d.className = 'ch-msg ' + (m.who === 'bot' ? 'ch-bot' : 'ch-me');
      if (m.who === 'bot') d.textContent = t(m.k, m.args);
      else {
        var id = m.text, hit = label(PARTS, id) || label(KINDS, id) || label(PRIORITY, id) || label(B_THINGS, id);
        d.textContent = id === '__skip' ? t('skip') : id === '__another' ? t('another') : id === '__finish' ? t('finish') : id === '__whole' ? t('whole')
          : hit ? hit[1 + L] : (P[id] ? P[id].name : id);
      }
      logEl.appendChild(d);
    });
    logEl.scrollTop = logEl.scrollHeight;
    chipsEl.innerHTML = '';
    chips().forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = c[1];
      b.addEventListener('click', function () { answer('', c[0]); });
      chipsEl.appendChild(b);
    });
    var typed = ['name', 'part', 'thing', 'kind', 'what', 'why', 'notes'].indexOf(S.step) >= 0;
    form.style.display = typed ? '' : 'none';
    input.placeholder = t('ph');
    var p = prompt();
    out.textContent = p || t('empty');
    out.classList.toggle('ch-empty', !p);
    root.querySelector('.ch-out-head strong').textContent = t('title');
    copyBtn.textContent = t('copy'); resetBtn.textContent = t('reset');
    copyBtn.disabled = !p;
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); var v = input.value; input.value = ''; answer(v); input.focus(); });
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } });
  copyBtn.addEventListener('click', function () {
    var p = prompt();
    var done = function () { copyBtn.textContent = t('copied'); setTimeout(function () { copyBtn.textContent = t('copy'); }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(p).then(done, function () { fallback(p); done(); });
    else { fallback(p); done(); }
  });
  function fallback(p) {
    var r = document.createRange(); r.selectNodeContents(out);
    var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    try { document.execCommand('copy'); } catch (e) {}
  }
  resetBtn.addEventListener('click', function () { S = fresh(); ask(); save(); render(); });
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });

  ask(); save(); render();
})();
