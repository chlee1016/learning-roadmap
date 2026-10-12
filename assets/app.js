'use strict';
const $ = id => document.getElementById(id);
const storageKey = 'learning-roadmap:completed:v1';
let data, category = 'all', selected, requestId = 0;
let completed;
try { const stored = JSON.parse(localStorage.getItem(storageKey) || '[]'); completed = new Set(Array.isArray(stored) ? stored : []); } catch { completed = new Set(); }
const escapeHtml = text => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Small, safe Markdown subset: headings, lists, tables, links, emphasis, quotes and fenced code.
// Raw HTML stays escaped; authors can use Markdown for their learning notes.
function markdown(source, sourcePath = 'index.md') {
  let code = false, list = false, out = '';
  const inline = text => escapeHtml(text).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const lines = source.replace(/<!--[\s\S]*?-->/g, '').split('\n');
  const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```')) { if(list){out+='</ul>';list=false;} out += code ? '</code></pre>' : '<pre><code>'; code = !code; continue; }
    if (code) { out += escapeHtml(line) + '\n'; continue; }
    const image = /^!\[([^\]]*)\]\(([^\s)]+)\)$/.exec(line.trim());
    if (image) {
      if (list) { out += '</ul>'; list = false; }
      try {
        const url = new URL(image[2], new URL(sourcePath, document.baseURI));
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== new URL(document.baseURI).origin) throw new Error();
        const src = escapeHtml(url.href), alt = escapeHtml(image[1]);
        out += `<figure class="diagram"><a href="${src}" target="_blank" rel="noopener noreferrer" aria-label="${alt} · 크게 보기"><img src="${src}" alt="${alt}" loading="lazy" decoding="async"></a><figcaption>${alt} · 눌러서 크게 보기</figcaption></figure>`;
      } catch { out += '<p>이미지 경로를 확인해 주세요.</p>'; }
      continue;
    }
    const item = /^[-*] (.+)$/.exec(line);
    if (item) { if (!list) out += '<ul>'; list = true; out += '<li>' + inline(item[1]) + '</li>'; continue; }
    if (list) { out += '</ul>'; list = false; }
    if (line.includes('|') && lines[i+1]?.includes('|') && cells(lines[i+1]).every(cell => /^:?-{3,}:?$/.test(cell))) {
      const headers = cells(line);
      out += '<div class="table-scroll" tabindex="0" role="region" aria-label="학습 내용 표"><table><thead><tr>';
      out += headers.map(cell => '<th scope="col">' + inline(cell) + '</th>').join('');
      out += '</tr></thead><tbody>'; i++;
      while (i+1 < lines.length && lines[i+1].trim().includes('|') && lines[i+1].trim()) {
        const row = cells(lines[++i]);
        out += '<tr>' + headers.map((_, index) => '<td>' + inline(row[index] || '') + '</td>').join('') + '</tr>';
      }
      out += '</tbody></table></div>'; continue;
    }
    const heading = /^(#{1,6}) (.+)$/.exec(line);
    if (heading) out += `<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`;
    else if (line.startsWith('> ')) out += '<blockquote>' + inline(line.slice(2)) + '</blockquote>';
    else if (line.trim()) out += '<p>' + inline(line) + '</p>';
  }
  if (list) out += '</ul>'; if (code) out += '</code></pre>'; return out;
}
const colors = ['#8b9bff','#47d5c0','#edbc73','#dd97f1','#73b5ff','#e997ae','#a9cb7d'];
let camera = {x:0,y:0,scale:1}, mapBounds, renderedCategory, needsFit = true;
let pointers = new Map(), gesture, dragged = false;
const viewport = $('viewport');
function paintCamera(animate = false) {
  $('roadmap').classList.toggle('camera-animate',animate);
  $('roadmap').style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
  $('zoom-label').textContent = `${Math.round(camera.scale*100)}%`;
}
function fitMap() {
  if (!mapBounds) return;
  const w = viewport.clientWidth, h = viewport.clientHeight;
  camera.scale = Math.min(1, (w-48)/mapBounds.width, (h-64)/mapBounds.height);
  camera.x = w/2; camera.y = h/2; paintCamera(true);
}
function zoom(factor, x = viewport.clientWidth/2, y = viewport.clientHeight/2) {
  const old = camera.scale, next = Math.max(.18,Math.min(2.5,old*factor));
  camera.x = x-(x-camera.x)*next/old; camera.y = y-(y-camera.y)*next/old;
  camera.scale = next; paintCamera();
}
function chooseCategory(id) { category = id; needsFit = true; render(); }
function makeBox(title, subtitle, x, y, color, action, type = '') {
  const button = document.createElement('button'); button.className = 'map-node ' + type;
  button.style.left = `${x}px`; button.style.top = `${y}px`; button.style.setProperty('--accent',color);
  const label = document.createElement('strong'); label.textContent = title;
  const small = document.createElement('small'); small.textContent = subtitle;
  button.append(label,small); button.onclick = e => { if (dragged) { e.preventDefault(); return; } action(); };
  return button;
}
function render() {
  const query = $('search').value.trim().toLowerCase();
  const searching = query.length > 0;
  const visible = data.nodes.filter(n => (category === 'all' || n.category === category) && (n.title + ' ' + data.categories.find(c => c.id === n.category).title).toLowerCase().includes(query));
  const container = $('roadmap'); container.replaceChildren();
  $('map-title').textContent = category === 'all' ? '전체 로드맵' : data.categories.find(c => c.id === category).title;
  $('count').textContent = `${visible.length}개 주제`;
  $('message').textContent = visible.length ? '' : '검색 결과가 없습니다.';
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('class','connections'); svg.setAttribute('aria-hidden','true');
  container.append(svg);
  const points = [];
  const overview = category === 'all' && !searching;
  if (overview) {
    data.categories.forEach((c,i) => {
      const angle = -Math.PI/2 + i*Math.PI*2/data.categories.length;
      const x = Math.cos(angle)*440, y = Math.sin(angle)*290;
      const count = data.nodes.filter(n => n.category === c.id).length;
      points.push({x,y,color:colors[i],box:makeBox(c.title,`${String(i+1).padStart(2,'0')} / ${count}개 주제 · 펼쳐보기`,x,y,colors[i],()=>chooseCategory(c.id),'category-node')});
    });
  } else {
    visible.forEach((n,i) => {
      const side = i%2 ? 1 : -1, rows = Math.ceil(visible.length/2);
      const x = side*360, y = (Math.floor(i/2)-(rows-1)/2)*112;
      const color = colors[data.categories.findIndex(c => c.id === n.category)];
      points.push({x,y,color,box:makeBox(n.title,completed.has(n.id) ? '✓ 학습 완료' : n.status === 'draft' ? '작성 예정 · 노트 열기 ↗' : '노트 열기 ↗',x,y,color,()=>{location.hash=encodeURIComponent(n.id);openNode(n);},completed.has(n.id)?'done':'')});
    });
  }
  for(const point of points) {
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    const bend = point.x*.5;
    path.setAttribute('d',`M 0 0 C ${bend} 0 ${bend} ${point.y} ${point.x} ${point.y}`);
    path.style.setProperty('--accent',point.color); svg.append(path);
    container.append(point.box);
  }
  const centerTitle = overview ? 'System Design' : searching ? '검색 결과' : $('map-title').textContent;
  container.append(makeBox(centerTitle,overview ? '7개의 경로, 42개의 주제' : '← 전체 지도 돌아가기',0,0,'#b9b5ff',()=>{ $('search').value=''; chooseCategory('all'); },'center-node'));
  mapBounds = {width:Math.max(640,...points.map(p=>Math.abs(p.x)*2+260)),height:Math.max(300,...points.map(p=>Math.abs(p.y)*2+110))};
  const done = data.nodes.filter(n => completed.has(n.id)).length;
  $('progress-label').textContent = `${done} / ${data.nodes.length} 완료 · ${Math.round(done/data.nodes.length*100)}%`;
  $('progress').max = data.nodes.length; $('progress').value = done;
  for(const b of $('categories').children) { b.classList.toggle('active',b.dataset.category === category); b.setAttribute('aria-pressed',String(b.dataset.category === category)); }
  if (needsFit || renderedCategory !== category) { fitMap(); needsFit = false; renderedCategory = category; }
}
viewport.addEventListener('wheel',e=>{e.preventDefault(); const rect=viewport.getBoundingClientRect(); zoom(Math.exp(-e.deltaY*.0015),e.clientX-rect.left,e.clientY-rect.top);},{passive:false});
viewport.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse' && e.button!==0) return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  // Keep a simple click on a node intact; capture blank-canvas drags.
  if(!e.target.closest('button')) viewport.setPointerCapture(e.pointerId);
  dragged=false; gesture={camera:{...camera},points:[...pointers.values()]};
});
viewport.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  const now=[...pointers.values()], start=gesture.points;
  if(now.length===2 && start.length===2){
    const distance=p=>Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y);
    const mid=p=>({x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2});
    const rect=viewport.getBoundingClientRect(), before=mid(start), after=mid(now);
    camera.scale=Math.max(.18,Math.min(2.5,gesture.camera.scale*distance(now)/Math.max(1,distance(start))));
    const ratio=camera.scale/gesture.camera.scale;
    camera.x=after.x-rect.left-(before.x-rect.left-gesture.camera.x)*ratio;
    camera.y=after.y-rect.top-(before.y-rect.top-gesture.camera.y)*ratio; dragged=true;paintCamera();
  } else if(now.length===1 && start.length===1){
    const dx=now[0].x-start[0].x,dy=now[0].y-start[0].y;
    if(Math.hypot(dx,dy)>5){dragged=true;viewport.setPointerCapture(e.pointerId);camera.x=gesture.camera.x+dx;camera.y=gesture.camera.y+dy;paintCamera();}
  }
});
const endPointer=e=>{pointers.delete(e.pointerId);gesture={camera:{...camera},points:[...pointers.values()]};};
viewport.addEventListener('pointerup',endPointer);viewport.addEventListener('pointercancel',endPointer);
viewport.addEventListener('lostpointercapture',e=>pointers.delete(e.pointerId));
$('zoom-in').onclick=()=>zoom(1.2);$('zoom-out').onclick=()=>zoom(1/1.2);$('fit').onclick=fitMap;
$('overview').onclick=()=>{$('search').value='';chooseCategory('all');};
viewport.addEventListener('keydown',e=>{
  if(e.target!==viewport)return;
  if(['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))e.preventDefault();
  if(e.key==='+'||e.key==='=')zoom(1.2);else if(e.key==='-')zoom(1/1.2);else if(e.key==='0')fitMap();
  else if(e.key.startsWith('Arrow')){camera.x+=e.key==='ArrowLeft'?40:e.key==='ArrowRight'?-40:0;camera.y+=e.key==='ArrowUp'?40:e.key==='ArrowDown'?-40:0;paintCamera();}
});
new ResizeObserver(()=>{if(data)fitMap();}).observe(viewport);
async function openNode(node) {
  selected = node; const current = ++requestId;
  $('reader-category').textContent = data.categories.find(c => c.id === node.category).title;
  $('reference').href = node.reference;
  $('complete').textContent = completed.has(node.id) ? '완료 표시 해제' : '학습 완료 표시';
  $('article').textContent = '학습 노트를 불러오는 중…';
  if (!$('reader').open) $('reader').showModal();
  try {
    const response = await fetch(node.content, {cache:'no-cache'}); if (!response.ok) throw new Error();
    const text = await response.text(); if (current !== requestId) return;
    $('article').innerHTML = markdown(text, node.content);
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
$('search').addEventListener('input',()=>{if(data){needsFit=true;render();}});
fetch('roadmaps/system-design.json', {cache:'no-cache'}).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(result => {
  data = result;
  for (const c of [{id:'all',title:'전체 로드맵'}, ...data.categories]) {
    const button = document.createElement('button'); button.dataset.category = c.id;
    const title = document.createElement('span'); title.textContent = c.title;
    const count = document.createElement('span'); count.textContent = c.id === 'all' ? data.nodes.length : data.nodes.filter(n => n.category === c.id).length;
    button.append(title,count); button.onclick = () => chooseCategory(c.id); $('categories').append(button);
  }
  render();
  const fromHash = () => { let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; } const n = data.nodes.find(n => n.id === id); if (n && (!selected || selected.id !== n.id || !$('reader').open)) openNode(n); };
  window.addEventListener('hashchange',fromHash); fromHash();
}).catch(() => { $('message').textContent = '로드맵을 불러오지 못했습니다. 웹 서버로 실행했는지 확인해 주세요.'; $('progress-label').textContent = '불러오기 실패'; });
