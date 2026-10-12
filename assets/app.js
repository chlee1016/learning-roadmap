'use strict';
const $ = id => document.getElementById(id);
const storageKey = 'learning-roadmap:completed:v1';
let data, category = 'all', selected, requestId = 0;
let completed;
try { const stored = JSON.parse(localStorage.getItem(storageKey) || '[]'); completed = new Set(Array.isArray(stored) ? stored : []); } catch { completed = new Set(); }
const escapeHtml = text => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Small, safe Markdown subset: headings, lists, links, emphasis, quotes and fenced code.
// Raw HTML stays escaped; authors can use Markdown for their learning notes.
function markdown(source) {
  let code = false, list = false, out = '';
  const inline = text => escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  for (const line of source.replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    if (line.startsWith('```')) { if(list){out+='</ul>';list=false;} out += code ? '</code></pre>' : '<pre><code>'; code = !code; continue; }
    if (code) { out += escapeHtml(line) + '\n'; continue; }
    const item = /^[-*] (.+)$/.exec(line);
    if (item) { if (!list) out += '<ul>'; list = true; out += '<li>' + inline(item[1]) + '</li>'; continue; }
    if (list) { out += '</ul>'; list = false; }
    const heading = /^(#{1,6}) (.+)$/.exec(line);
    if (heading) out += `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
    else if (line.startsWith('> ')) out += '<blockquote>' + inline(line.slice(2)) + '</blockquote>';
    else if (line.trim()) out += '<p>' + inline(line) + '</p>';
  }
  if (list) out += '</ul>'; if (code) out += '</code></pre>'; return out;
}
function render() {
  const query = $('search').value.trim().toLowerCase();
  const visible = data.nodes.filter(n => (category === 'all' || n.category === category) && (n.title + ' ' + data.categories.find(c => c.id === n.category).title).toLowerCase().includes(query));
  $('roadmap').replaceChildren();
  $('map-title').textContent = category === 'all' ? '전체 로드맵' : data.categories.find(c => c.id === category).title;
  $('count').textContent = `${visible.length}개 주제`;
  $('message').textContent = visible.length ? '' : '검색 결과가 없습니다.';
  for (const c of data.categories) {
    const nodes = visible.filter(n => n.category === c.id); if (!nodes.length) continue;
    const section = document.createElement('section'); section.className = 'lane';
    const title = document.createElement('h3'); title.textContent = c.title; section.append(title);
    const grid = document.createElement('div'); grid.className = 'nodes';
    for (const n of nodes) {
      const button = document.createElement('button'); button.className = 'node' + (completed.has(n.id) ? ' done' : '');
      const name = document.createElement('strong'); name.textContent = n.title;
      const state = document.createElement('small'); state.textContent = completed.has(n.id) ? '✓ 학습 완료' : n.status === 'draft' ? '작성 예정 · 학습 노트 ↗' : '학습 노트 ↗';
      button.append(name,state); button.onclick = () => { location.hash = encodeURIComponent(n.id); openNode(n); }; grid.append(button);
    }
    section.append(grid); $('roadmap').append(section);
  }
  const done = data.nodes.filter(n => completed.has(n.id)).length;
  $('progress-label').textContent = `${done} / ${data.nodes.length} 완료 · ${Math.round(done/data.nodes.length*100)}%`;
  $('progress').max = data.nodes.length; $('progress').value = done;
  for(const b of $('categories').children) { b.classList.toggle('active',b.dataset.category === category); b.setAttribute('aria-pressed',String(b.dataset.category === category)); }
}
async function openNode(node) {
  selected = node; const current = ++requestId;
  $('reader-category').textContent = data.categories.find(c => c.id === node.category).title;
  $('reference').href = node.reference;
  $('complete').textContent = completed.has(node.id) ? '완료 표시 해제' : '학습 완료 표시';
  $('article').textContent = '학습 노트를 불러오는 중…';
  if (!$('reader').open) $('reader').showModal();
  try {
    const response = await fetch(node.content); if (!response.ok) throw new Error();
    const text = await response.text(); if (current !== requestId) return;
    $('article').innerHTML = markdown(text);
    const related = data.edges.filter(e => e.to === node.id).map(e => data.nodes.find(n => n.id === e.from)).filter(Boolean);
    if (related.length) {
      const heading = document.createElement('h2'); heading.textContent = '함께 살펴볼 주제'; $('article').append(heading);
      for (const n of related) { const a = document.createElement('a'); a.href = '#' + encodeURIComponent(n.id); a.textContent = n.title; a.onclick = () => openNode(n); const p = document.createElement('p'); p.append(a); $('article').append(p); }
    }
  } catch { if (current === requestId) $('article').textContent = '글을 불러오지 못했습니다. 잠시 후 다시 열어 주세요.'; }
}
$('close-reader').onclick = () => $('reader').close();
$('reader').addEventListener('close', () => { ++requestId; history.replaceState(null,'',location.pathname + location.search); });
$('complete').onclick = () => {
  if (!selected) return;
  completed.has(selected.id) ? completed.delete(selected.id) : completed.add(selected.id);
  try { localStorage.setItem(storageKey,JSON.stringify([...completed])); } catch { $('message').textContent = '현재 브라우저에서는 학습 상태를 저장할 수 없습니다.'; }
  $('complete').textContent = completed.has(selected.id) ? '완료 표시 해제' : '학습 완료 표시'; render();
};
$('search').addEventListener('input',render);
fetch('roadmaps/system-design.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(result => {
  data = result;
  for (const c of [{id:'all',title:'전체 로드맵'}, ...data.categories]) {
    const button = document.createElement('button'); button.dataset.category = c.id;
    const title = document.createElement('span'); title.textContent = c.title;
    const count = document.createElement('span'); count.textContent = c.id === 'all' ? data.nodes.length : data.nodes.filter(n => n.category === c.id).length;
    button.append(title,count); button.onclick = () => { category = c.id; render(); }; $('categories').append(button);
  }
  render();
  const fromHash = () => { let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; } const n = data.nodes.find(n => n.id === id); if (n && (!selected || selected.id !== n.id || !$('reader').open)) openNode(n); };
  window.addEventListener('hashchange',fromHash); fromHash();
}).catch(() => { $('message').textContent = '로드맵을 불러오지 못했습니다. 웹 서버로 실행했는지 확인해 주세요.'; $('progress-label').textContent = '불러오기 실패'; });
