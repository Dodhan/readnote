'use strict';
const $=id=>document.getElementById(id);
const blank=name=>({name,day:{},all:{},notes:{}});
const example=blank('예시 작품 · 달의 서점');
[480,454,431,424,385,376,371,354,350,340,338,335].forEach((v,i)=>{example.day[i+1]=v;example.all[i+1]=v*2+120-i*7});
example.notes[5]='업로드 시간 변경';
const key='readnote-v1';
let state=JSON.parse(localStorage.getItem(key)||'null')||{works:[example,blank('주야 – 왕비가 된 사내')],index:0,mode:'day'};
let selected=null,action,episode;
const platforms = {joara:'조아라', dirito:'디리토'};
const book = () => state.works[state.index];
const channel = () => state.platform || 'joara';
// Earlier versions stored Joara records directly on the work.
function work() {
 if (channel() === 'joara') return book();
 if (!book().dirito) book().dirito = blank(book().name);
 return book().dirito;
}
const data = () => work()[state.mode];

const platformBar = document.createElement('div');
platformBar.className = 'bar';
const picker = document.createElement('div');
picker.className = 'tabs';
picker.setAttribute('role', 'group');
picker.setAttribute('aria-label', '연재 플랫폼');
for (const [id, name] of Object.entries(platforms)) {
 const button = document.createElement('button');
 button.textContent = name;
 button.dataset.platform = id;
 button.onclick = () => {state.platform = id; selected = null; save(); draw()};
 picker.append(button);
}
const favoritesButton = document.createElement('button');
favoritesButton.textContent = '선작 수 입력';
favoritesButton.onclick = () => openEditor('favorite');
platformBar.append(picker, favoritesButton);
document.querySelector('.hero').after(platformBar);
const layout = document.createElement('style');
layout.textContent = '.cards{grid-template-columns:repeat(4,minmax(0,1fr))}@media(max-width:760px){.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}';
document.head.append(layout);
function save(){localStorage.setItem(key,JSON.stringify(state))}
const ratio=(v,b)=>b>0?v/b*100:null;
const pct=v=>v==null?'—':Number(v.toFixed(1))+'%';
function draw(){
 const w=work(),d=data(),nums=Object.keys(d).map(Number).sort((a,b)=>a-b),last=nums.at(-1);
 if(!nums.includes(selected))selected=last;
 $('works').replaceChildren(...state.works.map((w,i)=>new Option(w.name,i,false,i===state.index)));
 $('title').textContent=book().name;
 for (const button of picker.children) button.setAttribute('aria-pressed', button.dataset.platform === channel());
 for(const mode of ['all','day'])$(mode).setAttribute('aria-pressed',mode===state.mode);
 const metrics=[['최근 회차 조회수',last?d[last].toLocaleString():'—',last?last+'화 기준':'기록 대기'],['직전 화 대비',pct(ratio(d[last],d[last-1])),last>1?(last-1)+'화 → '+last+'화':'연속 회차 기준'],['1화 대비',pct(ratio(d[last],d[1])),last?'1화 → '+last+'화':'첫 회차 기준']];
 const favorites = w.favorites;
 const base = w.all[1];
 const favoriteRate = favorites == null ? null : ratio(favorites, base);
 const favoriteLabel = favorites == null ? '선작 수 입력 전' : '선작 '+favorites.toLocaleString()+' · '+(base > 0 ? '1화 누적 '+base.toLocaleString()+'회' : '1화 누적 조회수 필요');
 metrics.push(['선작률',pct(favoriteRate),favoriteLabel]);
 $('cards').innerHTML=metrics.map(([t,v,s])=>'<div class="card"><label>'+t+'</label><strong>'+v+'</strong><small>'+s+'</small></div>').join('');
 $('rows').replaceChildren();
 for(const n of [...nums].reverse()){
 const row=$('rows').insertRow();
 for(const value of [n+'화',d[n].toLocaleString(),pct(ratio(d[n],d[n-1])),pct(ratio(d[n],d[1]))])row.insertCell().textContent=value;
 const btn=document.createElement('button');btn.textContent=w.notes[n]||'＋ 메모';btn.onclick=()=>openEditor('note',n);row.insertCell().append(btn);
 }
 $('detail').textContent=selected?selected+'화　·　조회수 '+d[selected].toLocaleString()+'　·　직전 화 대비 '+pct(ratio(d[selected],d[selected-1]))+'　·　1화 대비 '+pct(ratio(d[selected],d[1]))+(w.notes[selected]?'　·　'+w.notes[selected]:''):'조회수를 입력하면 회차별 흐름이 표시돼요.';
 if(!d[1]){$('chart').textContent=last?'1화 조회수가 1 이상이면 차트가 표시돼요.':'';return}
 const width=Math.max(720,nums.length*19),h=210, max=Math.max(100,...nums.map(n=>ratio(d[n],d[1]))),x=n=>56+(n-1)/Math.max(1,last-1)*(width-83),y=n=>15+(1-ratio(d[n],d[1])/max)*155;
 let svg='';
 for(let i=0;i<=4;i++){const height=15+i*38.75;svg+='<path stroke="#e3eae4" stroke-dasharray="4 5" d="M56 '+height+'H'+(width-25)+'"/><text x="45" y="'+(height+4)+'" text-anchor="end">'+Math.round(max*(1-i/4))+'%</text>'}
 let path='';nums.forEach((n,i)=>{path+=(nums[i-1]===n-1?'L':'M')+x(n)+' '+y(n)+' '});
 svg+='<path d="'+path+'" stroke="#24755f" stroke-width="3" fill="none"/>';
 nums.forEach((n,i)=>{svg+='<circle tabindex="0" role="button" aria-label="'+n+'화 상세" data-n="'+n+'" cx="'+x(n)+'" cy="'+y(n)+'" r="'+(n===selected?6:4)+'" stroke="#26745f" stroke-width="2" fill="'+(n===selected?'#26745f':'white')+'"/>';if(i%Math.ceil(nums.length/10)===0||i===nums.length-1)svg+='<text text-anchor="middle" x="'+x(n)+'" y="195">'+n+'화</text>'});
 $('chart').innerHTML='<svg style="min-width:'+Math.min(width,Math.max(345,nums.length*19))+'px" viewBox="0 0 '+width+' '+h+'" font-size="14" fill="#586f62">'+svg+'</svg>';
}
function openEditor(type,n){action=type;episode=n;
 const settings={favorite:['선작 수 입력',platforms[channel()]+' · '+book().name+'의 현재 선작 수를 기록해요. 선작률은 선작 수 ÷ 1화 누적 조회수 × 100으로 계산해요.'],note:[n+'화 메모','이 회차에서 기억해 둘 장면이나 연재 상황을 적어 주세요.'],add:['작품 추가','기록할 작품의 제목을 입력해 주세요.'],input:['조회수 입력',platforms[channel()]+' · '+book().name+' · '+(state.mode==='day'?'각 회차 공개 24시간 시점의 조회수':'누적 조회수')+'. 한 줄에 회차와 조회수를 공백이나 탭으로 구분해 주세요. 같은 회차는 새 값으로 갱신돼요.']};
 [$('heading').textContent,$('help').textContent]=settings[type];$('err').textContent='';
 if(type==='favorite'){
  const inputs = [['entry','현재 선작 수',work().favorites],['firstViews','1화 누적 조회수',work().all[1]]];
  $('field').replaceChildren();
  for(const [id,label,value] of inputs){
   const caption=document.createElement('label');
   caption.textContent=label;
   const input=document.createElement('input');
   input.id=id;input.type='text';input.inputMode='numeric';input.value=value??'';
   caption.append(input);$('field').append(caption);
  }
  $('dlg').showModal();$('entry').focus();return;
 }
 const field=document.createElement(type==='add'?'input':'textarea');field.id='entry';field.setAttribute('aria-label',settings[type][0]);field.rows=6;field.value=type==='note'?work().notes[n]||'':'';field.placeholder=type==='input'?'1화  1,200\n2화  1,050':'';$('field').replaceChildren(field);$('dlg').showModal();field.focus();
}
$('form').onsubmit=e=>{e.preventDefault();const value=$('entry').value.trim(),previous=JSON.stringify(state);
 try{if(action==='add'){if(!value)throw Error('작품 제목을 입력해 주세요.');state.works.push(blank(value));state.index=state.works.length-1;selected=null}
 else if(action==='favorite'){
  const parseCount = text => {
   if(!/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(text))throw Error('0 이상의 정수를 입력해 주세요.');
   const number=Number(text.replaceAll(',',''));
   if(!Number.isSafeInteger(number))throw Error('입력한 수가 너무 커요.');
   return number;
  };
  const favorites=parseCount(value), first=$('firstViews').value.trim();
  if(first)work().all[1]=parseCount(first);
  work().favorites=favorites;
 }
 else if(action==='note'){work().notes[episode]=value}
 else{const patch={};for(const [i,line] of value.split(/\r?\n/).entries()){const m=line.trim().match(/^(\d+)\s*화?(?:\s+|\s*,\s*)(\d+|\d{1,3}(?:,\d{3})+)\s*(?:회)?$/);if(!m)throw Error((i+1)+'번째 줄을 확인해 주세요. 예시: 12화 350');const n=Number(m[1]),v=Number(m[2].replaceAll(',',''));if(n<1||!Number.isSafeInteger(n)||!Number.isSafeInteger(v)||n in patch)throw Error((i+1)+'번째 줄의 회차 또는 조회수를 확인해 주세요.');patch[n]=v}Object.assign(data(),patch);selected=null}
 save();$('dlg').close();draw()}catch(error){state=JSON.parse(previous);$('err').textContent=error.message}};
$('cancel').onclick=()=>$('dlg').close();$('add').onclick=()=>openEditor('add');$('inputBtn').onclick=()=>openEditor('input');
$('works').onchange=e=>{state.index=Number(e.target.value);selected=null;save();draw()};
for(const mode of ['day','all'])$(mode).onclick=()=>{state.mode=mode;selected=null;save();draw()};
function choose(e){if(e.target.dataset.n){selected=Number(e.target.dataset.n);draw();if(e.type==='keydown')$('chart').querySelector('[data-n="'+selected+'"]').focus()}}
$('chart').onclick=choose;$('chart').onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();choose(e)}};
draw();
