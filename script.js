'use strict';

/* ===== DOM References ===== */
const textInput        = document.getElementById('textInput');
const clearBtn         = document.getElementById('clearBtn');
const pasteBtn         = document.getElementById('pasteBtn');
const statWithSpace    = document.getElementById('statWithSpace');
const statNoSpace      = document.getElementById('statNoSpace');
const statNoSpaceNL    = document.getElementById('statNoSpaceNewline');
const statHalfCalc     = document.getElementById('statHalfWidthCalc');
const statSpaceCount   = document.getElementById('statSpaceCount');
const statLineCount    = document.getElementById('statLineCount');
const statParaCount    = document.getElementById('statParagraphCount');
const statFullWidth    = document.getElementById('statFullWidth');
const statHalfWidth    = document.getElementById('statHalfWidth');
const customizeToggle  = document.getElementById('customizeToggle');
const customizePanel   = document.getElementById('customizePanel');
const collapseIcon     = document.getElementById('collapseIcon');
const toast            = document.getElementById('toast');

/* ===== Customize Options ===== */
const optIgnoreHalfSpace   = document.getElementById('optIgnoreHalfSpace');
const optIgnoreFullSpace   = document.getElementById('optIgnoreFullSpace');
const optIgnoreNewline     = document.getElementById('optIgnoreNewline');
const optIgnoreTab         = document.getElementById('optIgnoreTab');
const optIgnorePunctuation = document.getElementById('optIgnorePunctuation');
const optIgnoreSymbol      = document.getElementById('optIgnoreSymbol');
const optIgnoreNumber      = document.getElementById('optIgnoreNumber');
const optIgnoreAlpha       = document.getElementById('optIgnoreAlpha');
const optIgnoreCustom      = document.getElementById('optIgnoreCustom');

const STORAGE_KEY = 'textCounterCustomize';

/* ===== Customize: Save / Load ===== */
function saveCustomize() {
  const state = {
    halfSpace:   optIgnoreHalfSpace.checked,
    fullSpace:   optIgnoreFullSpace.checked,
    newline:     optIgnoreNewline.checked,
    tab:         optIgnoreTab.checked,
    punctuation: optIgnorePunctuation.checked,
    symbol:      optIgnoreSymbol.checked,
    number:      optIgnoreNumber.checked,
    alpha:       optIgnoreAlpha.checked,
    custom:      optIgnoreCustom.value
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadCustomize() {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (state.halfSpace   != null) optIgnoreHalfSpace.checked   = state.halfSpace;
    if (state.fullSpace   != null) optIgnoreFullSpace.checked   = state.fullSpace;
    if (state.newline     != null) optIgnoreNewline.checked     = state.newline;
    if (state.tab         != null) optIgnoreTab.checked         = state.tab;
    if (state.punctuation != null) optIgnorePunctuation.checked = state.punctuation;
    if (state.symbol      != null) optIgnoreSymbol.checked      = state.symbol;
    if (state.number      != null) optIgnoreNumber.checked      = state.number;
    if (state.alpha       != null) optIgnoreAlpha.checked       = state.alpha;
    if (state.custom      != null) optIgnoreCustom.value        = state.custom;
  } catch (e) { /* ignore */ }
}

/* ===== Helpers ===== */

/**
 * 全角判定: Unicode の全角文字かどうか
 * CJK, 全角記号, 全角英数字, ひらがな, カタカナ, 漢字 etc.
 */
function isFullWidth(ch) {
  const cp = ch.codePointAt(0);
  return (
    (cp >= 0x1100 && cp <= 0x115F)  ||  // Hangul Jamo
    cp === 0x2E3A || cp === 0x2E3B  ||  // Two-Em / Three-Em Dash
    (cp >= 0x2E80 && cp <= 0x303E)  ||  // CJK Radicals
    (cp >= 0x3041 && cp <= 0x33FF)  ||  // Hiragana, Katakana, CJK compat
    (cp >= 0xFE10 && cp <= 0xFE19)  ||  // Vertical Forms
    (cp >= 0xFE30 && cp <= 0xFE4F)  ||  // CJK Compat Forms
    (cp >= 0xFF01 && cp <= 0xFF60)  ||  // Fullwidth Latin/Punct
    (cp >= 0xFFE0 && cp <= 0xFFE6)  ||  // Fullwidth Signs
    (cp >= 0x1F004 && cp <= 0x1F0CF)||  // Playing cards
    (cp >= 0x1F200 && cp <= 0x1F2FF)||  // Enclosed CJK
    (cp >= 0x1F300 && cp <= 0x1F64F)||  // Misc Symbols and Pictographs
    (cp >= 0x20000 && cp <= 0x2A6DF)||  // CJK Ext B
    (cp >= 0x2A700 && cp <= 0x2CEAF)||  // CJK Ext C,D,E
    (cp >= 0x2CEB0 && cp <= 0x2EBEF)||  // CJK Ext F
    (cp >= 0x30000 && cp <= 0x3134F)||  // CJK Ext G
    (cp >= 0xF900  && cp <= 0xFAFF)  ||  // CJK Compat Ideographs
    (cp >= 0x4E00  && cp <= 0x9FFF)  ||  // CJK Unified Ideographs
    (cp >= 0x3400  && cp <= 0x4DBF)      // CJK Ext A
  );
}

/**
 * カスタム条件に基づいたフィルタ済み文字列を返す
 * 「文字数（空白込み）」カード専用
 */
function applyCustomFilter(text) {
  let result = text;

  if (optIgnoreNewline.checked)     result = result.replace(/\r?\n|\r/g, '');
  if (optIgnoreTab.checked)         result = result.replace(/\t/g, '');
  if (optIgnoreHalfSpace.checked)   result = result.replace(/ /g, '');
  if (optIgnoreFullSpace.checked)   result = result.replace(/　/g, '');
  if (optIgnorePunctuation.checked) result = result.replace(/[。、，．・]/g, '');
  if (optIgnoreSymbol.checked)      result = result.replace(/[！？…‥〜『』「」【】〈〉《》『』【】〔〕～！？]/g, '');
  if (optIgnoreNumber.checked)      result = result.replace(/[0-9０-９]/g, '');
  if (optIgnoreAlpha.checked)       result = result.replace(/[a-zA-Zａ-ｚＡ-Ｚ]/g, '');

  const customChars = optIgnoreCustom.value;
  if (customChars) {
    const escaped = [...customChars].map(ch => ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('');
    if (escaped) result = result.replace(new RegExp(`[${escaped}]`, 'g'), '');
  }

  return result;
}

/* ===== Core Count Function ===== */
function countAll() {
  const raw = textInput.value;

  /* --- 文字数（空白込み・カスタム適用） --- */
  const customText = applyCustomFilter(raw);
  statWithSpace.textContent = [...customText].length;

  /* --- 文字数（空白抜き） --- */
  const noSpaceText = raw.replace(/[ 　\t]/g, '');
  statNoSpace.textContent = [...noSpaceText].length;

  /* --- 文字数（改行・空白抜き） --- */
  const noSpaceNLText = raw.replace(/[ 　\t\r\n]/g, '');
  statNoSpaceNL.textContent = [...noSpaceNLText].length;

  /* --- 文字数（半角0.5文字換算） --- */
  let halfCalc = 0;
  for (const ch of [...raw]) {
    if (isFullWidth(ch)) {
      halfCalc += 1;
    } else {
      halfCalc += 0.5;
    }
  }
  statHalfCalc.textContent = halfCalc % 1 === 0 ? halfCalc : halfCalc.toFixed(1);

  /* --- 空白の数 --- */
  const spaceMatches = raw.match(/[ 　\t]/g);
  statSpaceCount.textContent = spaceMatches ? spaceMatches.length : 0;

  /* --- 行数 --- */
  const lines = raw === '' ? [] : raw.split(/\r?\n|\r/);
  statLineCount.textContent = raw === '' ? 0 : lines.length;

  /* --- 段落数 --- */
  const paras = raw.trim() === '' ? [] : raw.trim().split(/(?:\r?\n|\r){2,}/);
  statParaCount.textContent = paras.length > 0 && paras[0] !== '' ? paras.length : 0;

  /* --- 全角 / 半角 内訳 --- */
  let fullWidthCount = 0;
  let halfWidthCount = 0;
  for (const ch of [...raw]) {
    if (/[\r\n\t]/.test(ch)) continue; // 改行・タブはカウント対象外
    if (isFullWidth(ch)) fullWidthCount++;
    else halfWidthCount++;
  }
  statFullWidth.textContent = fullWidthCount;
  statHalfWidth.textContent = halfWidthCount;
}

/* ===== Toast Notification ===== */
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

/* ===== Copy Handler ===== */
async function copyValue(card, value) {
  try {
    await navigator.clipboard.writeText(String(value));
    card.classList.add('copied');
    showToast(`「${value}」をコピーしました`);
    setTimeout(() => card.classList.remove('copied'), 600);
  } catch (e) {
    showToast('コピーに失敗しました');
  }
}

/* ===== Stat Card Click Events ===== */
document.querySelectorAll('.stat-card').forEach(card => {
  card.addEventListener('click', () => {
    const stat = card.dataset.stat;
    let value;

    switch (stat) {
      case 'withSpace':    value = statWithSpace.textContent;  break;
      case 'noSpace':      value = statNoSpace.textContent;    break;
      case 'noSpaceNewline': value = statNoSpaceNL.textContent; break;
      case 'halfWidthCalc':  value = statHalfCalc.textContent;  break;
      case 'spaceCount':   value = statSpaceCount.textContent; break;
      case 'lineCount':    value = statLineCount.textContent;  break;
      case 'paragraphCount': value = statParaCount.textContent; break;
      case 'breakdown':
        value = `全角 ${statFullWidth.textContent} 半角 ${statHalfWidth.textContent}`;
        break;
      default: value = '0';
    }

    copyValue(card, value);
  });
});

/* ===== Textarea Events ===== */
textInput.addEventListener('input', countAll);

/* ===== Button Actions ===== */
clearBtn.addEventListener('click', () => {
  textInput.value = '';
  countAll();
  showToast('テキストをクリアしました');
});

pasteBtn.addEventListener('click', async () => {
  try {
    const clipboardText = await navigator.clipboard.readText();
    if (!clipboardText) {
      showToast('クリップボードにテキストがありません');
      return;
    }
    textInput.value = clipboardText;
    countAll();
    showToast('クリップボードから貼り付けました');
  } catch (e) {
    showToast('貼り付けに失敗しました');
  }
});

/* ===== Customize Toggle ===== */
customizeToggle.addEventListener('click', toggleCustomize);
customizeToggle.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCustomize(); }
});

function toggleCustomize() {
  const expanded = customizeToggle.getAttribute('aria-expanded') === 'true';
  customizeToggle.setAttribute('aria-expanded', !expanded);
  customizePanel.hidden = expanded;
}

/* ===== Customize Option Events ===== */
[
  optIgnoreHalfSpace, optIgnoreFullSpace, optIgnoreNewline, optIgnoreTab,
  optIgnorePunctuation, optIgnoreSymbol, optIgnoreNumber, optIgnoreAlpha,
  optIgnoreCustom
].forEach(el => el.addEventListener('input', () => {
  saveCustomize();
  countAll();
}));

function updateFooterAuthor() {
  const footerAuthor = document.getElementById('footer-author');
  const hostname = window.location.hostname;
  const baseYear = 2026;
  const currentYear = new Date().getFullYear();
  const yearText = currentYear > baseYear ? `${baseYear}~${currentYear}` : `${baseYear}`;

  if (hostname.includes('hamuzon-jp.f5.si')) {
    footerAuthor.innerHTML = `&copy;${yearText} <a href="https://hamuzon-jp.f5.si" target="_blank">@hamuzon</a>`;
  } else if (hostname.includes('hamuzon.github.io')) {
    footerAuthor.innerHTML = `&copy;${yearText} <a href="https://hamuzon.github.io" target="_blank">@hamuzon</a>`;
  } else if (hostname.includes('hamusata.f5.si')) {
    footerAuthor.innerHTML = `&copy;${yearText} <a href="https://hamusata.f5.si" target="_blank">@hamuzata</a>`;
  } else {
    footerAuthor.innerHTML = `&copy;${yearText} 文字数カウンター / Character Counter`;
  }
}

/* ===== Init ===== */
loadCustomize();
countAll();
updateFooterAuthor();
