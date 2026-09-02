import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import kaplay from 'kaplay';
import './styles.css';

const TILE = 32;
const MAP_W = 30;
const MAP_H = 22;
const STORAGE = 'lucas-portfolio-rpg-v5';

const buildings = [
  { id:'about', title:'CASA • SOBRE MIM', x:3, y:2, w:6, h:4, door:[5,6], color:'#b94d3b', npc:'Lucas' },
  { id:'skills', title:'LAB SENAI • SKILLS', x:12, y:2, w:6, h:4, door:[14,6], color:'#3e76d1', npc:'Mentor' },
  { id:'projects', title:'ARENA • PROJETOS', x:21, y:2, w:6, h:4, door:[23,6], color:'#e98a19', npc:'Curador' },
  { id:'contact', title:'LOJA • CONTATO', x:21, y:14, w:6, h:4, door:[23,13], color:'#cf4a49', npc:'Atendente' },
];

const defaultContent = {
  name:'Lucas Amaral', role:'Desenvolvedor em formação',
  bio:'Sou estudante de Desenvolvimento de Sistemas e gosto de transformar problemas reais em soluções web. Este portfólio é uma pequena cidade jogável onde cada prédio representa uma parte da minha trajetória.',
  class:'Dev Full Stack Jr.', origin:'Criciúma, SC', focus:'Web • APIs • Banco de dados', mode:'Aprender construindo',
  skills:[
    {group:'BASE', items:[['JavaScript','85'],['Git','80'],['Lógica','90'],['HTML/CSS','88']]},
    {group:'WEB', items:[['React','72'],['JavaScript','85'],['CSS','82'],['Three.js','60']]},
    {group:'DADOS / BACKEND', items:[['Java','70'],['Spring','62'],['SQL','78'],['APIs REST','75']]},
    {group:'QUALIDADE', items:[['Testes','60'],['Documentação','80'],['Deploy','65'],['Arquitetura','62']]},
  ],
  projects:[
    {title:'Biblioteca', desc:'Sistema com front-end e back-end para cadastro, listagem e consulta de livros.', tags:['Front-end','Back-end','CRUD'], links:['https://github.com/Lucas-Amaral-dom/biblioteca-front','https://github.com/Lucas-Amaral-dom/biblioteca-back-']},
    {title:'Projeto Guarda-vidas', desc:'Solução web com API e interface para apoiar um contexto de guarda-vidas.', tags:['Java','API','Sistema web'], links:['https://github.com/Lucas-Amaral-dom/projeto_guardavidas','https://github.com/Lucas-Amaral-dom/projeto-guardavidas-Back']},
  ],
  contact:{email:'seuemail@exemplo.com', linkedin:'https://www.linkedin.com/', github:'https://github.com/Lucas-Amaral-dom'},
};

function clone(v){ return JSON.parse(JSON.stringify(v)); }
function loadContent(){ try{return {...clone(defaultContent), ...JSON.parse(localStorage.getItem(STORAGE)||'{}')}}catch{return clone(defaultContent)} }
function saveContent(c){localStorage.setItem(STORAGE,JSON.stringify(c));}

function PixelDialog({title, pages, onClose}){
  const [page,setPage]=useState(0);
  return <div className="dialog-layer" onClick={onClose}><div className="pixel-dialog" onClick={e=>e.stopPropagation()}>
    <div className="dialog-head"><span>{title}</span><button onClick={onClose}>✕</button></div>
    <div className="dialog-body">{pages[page]}</div>
    <div className="dialog-foot"><span>{page+1}/{pages.length}</span><button onClick={()=>page<pages.length-1?setPage(page+1):onClose()}>{page<pages.length-1?'▶ CONTINUAR':'A FECHAR'}</button></div>
  </div></div>
}

function Pokedex({content,onClose}){ return <div className="modal-layer"><div className="pokedex">
  <header><b>POKÉDEX DE SKILLS</b><button onClick={onClose}>✕</button></header>
  <div className="dex-grid">{content.skills.flatMap(g=>g.items.map(([n,l])=><div className="dex-card" key={g.group+n}><span>{n}</span><div className="bar"><i style={{width:l+'%'}}/></div><small>{g.group} · {l}%</small></div>))}</div>
</div></div> }

function ContactForm(){
 const [form,setForm]=useState({name:'',email:'',message:''}); const [sent,setSent]=useState(false);
 const submit=e=>{e.preventDefault();const key='portfolio-contact-messages';const arr=JSON.parse(localStorage.getItem(key)||'[]');arr.push({...form,createdAt:new Date().toISOString()});localStorage.setItem(key,JSON.stringify(arr));setSent(true)};
 if(sent)return <div className="sent">✓ Mensagem registrada!<br/><small>O envio local funciona como fallback. Conecte o backend do arquivo <b>supabase/schema.sql</b> para a caixa de entrada em nuvem.</small></div>;
 return <form className="contact-form" onSubmit={submit}><input required placeholder="Seu nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><input required type="email" placeholder="Seu e-mail" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><textarea required placeholder="Sua mensagem" value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/><button>ENVIAR MENSAGEM ▶</button></form>
}

function Interior({building,content,onExit}){
 const [pos,setPos]=useState({x:50,y:72}); const [talk,setTalk]=useState(false); const [near,setNear]=useState(false);
 const bounds={x:10,y:18,w:80,h:68};
 useEffect(()=>{const keys=new Set();const down=e=>{const key=e.key.toLowerCase();keys.add(key);if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','enter'].includes(key))e.preventDefault()};const up=e=>keys.delete(e.key.toLowerCase());addEventListener('keydown',down);addEventListener('keyup',up);let raf;const loop=()=>{setPos(p=>{let x=p.x,y=p.y;const sp=.72;if(keys.has('w')||keys.has('arrowup'))y-=sp;if(keys.has('s')||keys.has('arrowdown'))y+=sp;if(keys.has('a')||keys.has('arrowleft'))x-=sp;if(keys.has('d')||keys.has('arrowright'))x+=sp;x=Math.max(bounds.x,Math.min(bounds.x+bounds.w,x));y=Math.max(bounds.y,Math.min(bounds.y+bounds.h,y));return{x,y}});raf=requestAnimationFrame(loop)};raf=requestAnimationFrame(loop);return()=>{cancelAnimationFrame(raf);removeEventListener('keydown',down);removeEventListener('keyup',up)}},[]);
 useEffect(()=>setNear(Math.hypot(pos.x-50,pos.y-42)<12),[pos]);
 useEffect(()=>{const h=e=>{if(e.key==='Escape'){e.preventDefault();onExit()}if((e.key==='Enter'||e.key.toLowerCase()==='a')&&near){e.preventDefault();setTalk(true)}};addEventListener('keydown',h);return()=>removeEventListener('keydown',h)},[near,onExit]);
 const title=building.id==='about'?'CASA SOBRE MIM':building.id==='skills'?'LAB SENAI':building.id==='projects'?'ARENA DE PROJETOS':'LOJA DE CONTATO';
 const furniture=building.id==='skills'?['💻','🧪','📦','🖥️']:building.id==='projects'?['🏆','🏆','📋','📋']:building.id==='contact'?['🛒','📦','💻']:['🛋️','🖼️','🪴','📚'];
 const pages=building.id==='about'?[<><b>{content.name}</b><p>{content.bio}</p></>,<div className="stats"><b>CLASSE</b><span>{content.class}</span><b>ORIGEM</b><span>{content.origin}</span><b>FOCO</b><span>{content.focus}</span></div>]:building.id==='skills'?[<><b>MENTOR DO LAB</b><p>Quatro bancadas guardam minhas principais competências.</p></>,...content.skills.map(g=><div key={g.group}><b>{g.group}</b>{g.items.map(([n,l])=><p key={n}>▸ {n} <em>{l}%</em></p>)}</div>)]:building.id==='projects'?[<><b>CURADOR DA ARENA</b><p>Os troféus guardam meus projetos.</p></>,...content.projects.map(p=><div key={p.title}><b>{p.title}</b><p>{p.desc}</p><p>{p.tags.join(' · ')}</p><div>{p.links.map((l,i)=><a href={l} target="_blank" rel="noreferrer" key={l}>REPO {i+1} ↗</a>)}</div></div>)]:[<><b>ATENDENTE</b><p>Fale comigo sobre estágio, projetos ou colaboração.</p></>,<div className="contact-data"><a href={'mailto:'+content.contact.email}>{content.contact.email}</a><a href={content.contact.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a><a href={content.contact.github} target="_blank" rel="noreferrer">GitHub ↗</a></div>,<ContactForm/>];
 return <div className="interior-scene"><div className="interior-head"><span>{title}</span><small>WASD / SETAS · A/ENTER FALA · ESC SAI</small></div><div className={'interior-room room-'+building.id}>
   <div className="wall-top"/><div className="rug"/><button className="door-exit" onClick={onExit}>SAÍDA</button>
   {furniture.map((f,i)=><div className="furniture" style={{left:(18+(i%2)*55)+'%',top:(28+Math.floor(i/2)*30)+'%'}} key={i}>{f}</div>)}
   <div className="npc" style={{left:'50%',top:'42%'}}><span className="npc-face">●</span><small>{building.npc}</small></div>
   <div className="hero" style={{left:pos.x+'%',top:pos.y+'%'}}><span className="hero-shadow"/><span className="hero-body"/></div>
   {near&&<button className="interact-hint" onClick={()=>setTalk(true)}>A / ENTER</button>}
 </div><button className="exit-room" onClick={onExit}>← VOLTAR À CIDADE</button>
 {talk&&<PixelDialog title={title} pages={pages} onClose={()=>setTalk(false)}/>}<div className="interior-touch"><button onClick={()=>setPos(p=>({...p,y:Math.max(bounds.y,p.y-3)}))}>▲</button><button onClick={()=>setPos(p=>({...p,x:Math.max(bounds.x,p.x-3)}))}>◀</button><button onClick={()=>setPos(p=>({...p,y:Math.min(bounds.y+bounds.h,p.y+3)}))}>▼</button><button onClick={()=>setPos(p=>({...p,x:Math.min(bounds.x+bounds.w,p.x+3)}))}>▶</button></div></div>
}

function Admin({content,setContent,onBack}){
 const [draft,setDraft]=useState(clone(content)); const [tab,setTab]=useState('bio');
 const update=(path,value)=>{const d=clone(draft);let o=d;for(let i=0;i<path.length-1;i++)o=o[path[i]];o[path.at(-1)]=value;setDraft(d)};const save=()=>{setContent(draft);saveContent(draft)};
 return <div className="admin-page"><div className="admin-shell"><header><div><small>PORTFOLIO RPG</small><h1>Modo Edição</h1></div><button onClick={onBack}>← VOLTAR</button></header><nav>{['bio','skills','projects','contact'].map(x=><button className={tab===x?'on':''} onClick={()=>setTab(x)} key={x}>{x}</button>)}</nav>
 {tab==='bio'&&<section className="form-grid"><label>Nome<input value={draft.name} onChange={e=>update(['name'],e.target.value)}/></label><label>Cargo<input value={draft.role} onChange={e=>update(['role'],e.target.value)}/></label><label className="wide">Bio<textarea value={draft.bio} onChange={e=>update(['bio'],e.target.value)}/></label><label>Classe<input value={draft.class} onChange={e=>update(['class'],e.target.value)}/></label><label>Origem<input value={draft.origin} onChange={e=>update(['origin'],e.target.value)}/></label><label>Foco<input value={draft.focus} onChange={e=>update(['focus'],e.target.value)}/></label></section>}
 {tab==='skills'&&<section className="form-stack">{draft.skills.map((g,gi)=><div className="edit-group" key={g.group}><h3>{g.group}</h3>{g.items.map((it,ii)=><div className="skill-row" key={ii}><input value={it[0]} onChange={e=>update(['skills',gi,'items',ii,0],e.target.value)}/><input type="number" min="0" max="100" value={it[1]} onChange={e=>update(['skills',gi,'items',ii,1],e.target.value)}/></div>)}</div>)}</section>}
 {tab==='projects'&&<section className="form-stack">{draft.projects.map((p,i)=><div className="edit-group" key={i}><input value={p.title} onChange={e=>update(['projects',i,'title'],e.target.value)}/><textarea value={p.desc} onChange={e=>update(['projects',i,'desc'],e.target.value)}/><input value={p.tags.join(', ')} onChange={e=>update(['projects',i,'tags'],e.target.value.split(',').map(x=>x.trim()))}/></div>)}</section>}
 {tab==='contact'&&<section className="form-grid"><label>Email<input value={draft.contact.email} onChange={e=>update(['contact','email'],e.target.value)}/></label><label>LinkedIn<input value={draft.contact.linkedin} onChange={e=>update(['contact','linkedin'],e.target.value)}/></label><label>GitHub<input value={draft.contact.github} onChange={e=>update(['contact','github'],e.target.value)}/></label></section>}
 <footer><button className="save-main" onClick={save}>💾 SALVAR ALTERAÇÕES</button></footer></div></div>
}

function App(){
 const mapRef=useRef(null); const [route,setRoute]=useState(location.hash); const [content,setContent]=useState(loadContent); const [dex,setDex]=useState(false); const [muted,setMuted]=useState(false); const [badges,setBadges]=useState(()=>JSON.parse(localStorage.getItem('portfolio-badges')||'[]')); const [near,setNear]=useState(null); const [title,setTitle]=useState(true); const [interior,setInterior]=useState(null);
 useEffect(()=>{const on=()=>setRoute(location.hash);addEventListener('hashchange',on);return()=>removeEventListener('hashchange',on)},[]);
 useEffect(()=>{if(route==='#/auth'||route==='#/admin'||interior)return;const k=kaplay({root:mapRef.current,width:MAP_W*TILE,height:MAP_H*TILE,background:[135,194,103],crisp:true,letterbox:true,global:false});
  const rows=['tttttttttttttttttttttttttttttt','tgggggggggggggggggggggggggggggt','tgggggggggggggggggggggggggggggt','tgggggggggggggggggggggggggggggt','tgggggggggggggggggggggggggggggt','tgrrrrrrrrrrrrrrrrrrrrrrrrrrrgt','tgggggggggggggggggggggggggggggt','tgggwwwwwwggggggggwwwwwwgggggt','tgggwwwwwwggggggggwwwwwwgggggt','tgggwwwwwwggggggggwwwwwwgggggt','tggggggggggggppppggggggggggggt','tggggggggggggppppggggggggggggt','tggggggggggggppppggggggggggggt','tggggggggggggppppggggggggggggt','tgrrrrrrrrrrrrrrrrrrrrrrrrrrrgt','tgggggggggggggggggggggggggggggt','tgggggggggggggggggggggggggggggt','tgggggggggggggggggggggggggggggt','tgggggggggggggggggggggggggggggt','tgggggggggggggggggggggggggggggt','tgggggggggggggggggggggggggggggt','ttttttttttttttttttttttttttttttt'];
  const C={grass:k.rgb(135,194,103),road:k.rgb(225,204,164),water:k.rgb(86,164,218),tree:k.rgb(45,125,73),trunk:k.rgb(120,77,48),ink:k.rgb(30,39,36),flower:k.rgb(241,99,126),lamp:k.rgb(255,224,111)};
  function tile(ch,x,y){const p=k.vec2(x*TILE,y*TILE);k.add([k.rect(TILE,TILE),k.pos(p),k.color(ch==='r'?C.road:ch==='w'?C.water:C.grass),k.z(0)]);if(ch==='g'){k.add([k.rect(3,3),k.pos(p.add(8,9)),k.color(170,219,120),k.z(1)]);k.add([k.rect(2,4),k.pos(p.add(23,21)),k.color(104,172,83),k.z(1)])}if(ch==='r'){k.add([k.rect(TILE,4),k.pos(p.add(0,14)),k.color(242,222,184),k.z(1)])}if(ch==='w'){k.add([k.rect(17,2),k.pos(p.add(7,8)),k.color(170,224,250),k.z(1)])}if(ch==='t'){k.add([k.rect(8,15),k.pos(p.add(12,15)),k.color(C.trunk),k.z(2)]);k.add([k.circle(12),k.pos(p.add(16,12)),k.color(C.tree),k.outline(2,C.ink),k.z(3)])}if(ch==='p'){k.add([k.rect(TILE,7),k.pos(p.add(0,12)),k.color(C.trunk),k.z(2)])}}
  rows.forEach((r,y)=>[...r].forEach((ch,x)=>tile(ch,x,y)));
  function building(b){const x=b.x*TILE,y=b.y*TILE,w=b.w*TILE,h=b.h*TILE;k.add([k.rect(w,h),k.pos(x,y),k.color(238,221,176),k.outline(3,C.ink),k.z(8)]);k.add([k.rect(w+8,18),k.pos(x-4,y-14),k.color(b.color),k.outline(3,C.ink),k.z(9)]);for(let xx=0;xx<w;xx+=12)k.add([k.rect(8,4),k.pos(x+xx,y-9),k.color(255,185,77),k.z(10)]);k.add([k.rect(26,27),k.pos(x+w/2-13,y+h-27),k.color(C.trunk),k.outline(2,C.ink),k.z(10)]);k.add([k.rect(12,10),k.pos(x+12,y+h-23),k.color(130,204,231),k.outline(2,C.ink),k.z(10)]);k.add([k.rect(12,10),k.pos(x+w-24,y+h-23),k.color(130,204,231),k.outline(2,C.ink),k.z(10)])}
  buildings.forEach(building);[[2,8],[9,10],[19,9],[27,12],[7,17],[16,18],[26,20]].forEach(([x,y])=>k.add([k.rect(4,4),k.pos(x*TILE+8,y*TILE+8),k.color(C.flower),k.z(4)]));[[10,8],[20,11],[10,18],[19,19]].forEach(([x,y])=>{k.add([k.rect(4,20),k.pos(x*TILE+14,y*TILE+8),k.color(C.ink),k.z(4)]);k.add([k.rect(14,10),k.pos(x*TILE+9,y*TILE+2),k.color(C.lamp),k.outline(2,C.ink),k.z(5)])});
  for(let x=0;x<MAP_W;x++){for(const y of [0,MAP_H-1])k.add([k.rect(TILE,TILE),k.pos(x*TILE,y*TILE),k.area(),k.body({isStatic:true}),k.opacity(0)])}for(let y=0;y<MAP_H;y++){for(const x of [0,MAP_W-1])k.add([k.rect(TILE,TILE),k.pos(x*TILE,y*TILE),k.area(),k.body({isStatic:true}),k.opacity(0)])}[...rows.entries()].forEach(([y,r])=>[...r].forEach((ch,x)=>{if(ch==='w')k.add([k.rect(TILE,TILE),k.pos(x*TILE,y*TILE),k.area(),k.body({isStatic:true}),k.opacity(0)])}));
  buildings.forEach(b=>{for(let yy=b.y;yy<b.y+b.h;yy++)for(let xx=b.x;xx<b.x+b.w;xx++)if(!(xx===b.door[0]&&yy===b.door[1]))k.add([k.rect(TILE,TILE),k.pos(xx*TILE,yy*TILE),k.area(),k.body({isStatic:true}),k.opacity(0)]);k.add([k.rect(40,24),k.pos(b.door[0]*TILE-4,b.door[1]*TILE),k.area(),k.opacity(0),`door-${b.id}`])});
  k.loadSprite('player','assets/spritesheet.png',{sliceX:39,sliceY:31,anims:{down:{from:936,to:939,loop:true,speed:8},side:{from:975,to:978,loop:true,speed:8},up:{from:1014,to:1017,loop:true,speed:8},idleDown:{from:936,to:936},idleSide:{from:975,to:975},idleUp:{from:1014,to:1014}}});
  const player=k.add([k.sprite('player',{anim:'idleDown'}),k.pos(15*TILE,12*TILE),k.anchor('center'),k.area({shape:new k.Rect(k.vec2(0,4),12,10)}),k.body(),k.scale(1.8),k.z(30),{speed:175,dir:'down'}]);let input={x:0,y:0};
  k.onUpdate(()=>{input={x:(k.isKeyDown('right')||k.isKeyDown('d')?1:0)-(k.isKeyDown('left')||k.isKeyDown('a')?1:0),y:(k.isKeyDown('down')||k.isKeyDown('s')?1:0)-(k.isKeyDown('up')||k.isKeyDown('w')?1:0)};if(input.x||input.y){const len=Math.hypot(input.x,input.y)||1,vx=input.x/len,vy=input.y/len;player.move(vx*player.speed,vy*player.speed);if(Math.abs(vx)>Math.abs(vy)){player.dir=vx>0?'right':'left';player.flipX=vx<0;player.play('side')}else{player.dir=vy>0?'down':'up';player.play(vy>0?'down':'up')}}else player.play(player.dir==='up'?'idleUp':player.dir==='down'?'idleDown':'idleSide');k.camPos(player.pos)});
  buildings.forEach(b=>{player.onCollide(`door-${b.id}`,()=>setNear(b));player.onCollideEnd(`door-${b.id}`,()=>setNear(null))});
  const enter=()=>{if(near){setNear(null);setInterior(near);setBadges(prev=>{if(prev.includes(near.id))return prev;const n=[...prev,near.id];localStorage.setItem('portfolio-badges',JSON.stringify(n));return n})}};k.onKeyPress('enter',enter);k.onKeyPress('a',enter);
  const dpadMove=dir=>{const v={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];if(!v)return;player.move(v[0]*player.speed*.18,v[1]*player.speed*.18);if(v[0]){player.flipX=v[0]<0;player.dir=v[0]>0?'right':'left';player.play('side')}else{player.dir=v[1]>0?'down':'up';player.play(v[1]>0?'down':'up')}};window.__rpgMove=dpadMove;
  return()=>{k.destroy();delete window.__rpgMove};
 },[route,interior,near]);
 useEffect(()=>{const buttons=document.querySelectorAll('.dpad button');const handlers=[];buttons.forEach(b=>{const h=e=>{e.preventDefault();window.__rpgMove?.(b.dataset.dir)};b.addEventListener('pointerdown',h);handlers.push([b,h])});return()=>handlers.forEach(([b,h])=>b.removeEventListener('pointerdown',h))},[interior]);
 if(route==='#/auth'||route==='#/admin')return <Admin content={content} setContent={setContent} onBack={()=>location.hash=''}/>;
 if(interior)return <Interior building={interior} content={content} onExit={()=>setInterior(null)}/>;
 return <div className="app"><div className="game-frame"><div className="game-top"><div><strong>CIDADE DEV</strong><span>AVENTURA PORTFÓLIO</span></div><div className="hud-right"><button onClick={()=>setDex(true)}>▣ SKILLS</button><span>INSÍGNIAS {badges.length}/4</span>{[0,1,2,3].map(i=><i key={i} className={i<badges.length?'earned':''}/>)}</div></div><div className="canvas-wrap" ref={mapRef}/><div className="game-bottom"><div className="hint">WASD / SETAS · A ou ENTER na porta · ESC fecha</div><div className="actions"><button onClick={()=>setMuted(!muted)}>{muted?'🔇':'🔊'}</button><button onClick={()=>location.hash='#/admin'}>⚙ ADMIN</button></div></div></div><div className="dpad"><button data-dir="up">▲</button><button data-dir="left">◀</button><button data-dir="down">▼</button><button data-dir="right">▶</button></div>{title&&<div className="title-screen" onClick={()=>setTitle(false)}><div className="title-logo"><small>PORTFOLIO RPG</small><h1>{content.name}</h1><p>{content.role}</p></div><div className="start">APERTE START</div><small>WASD / SETAS PARA JOGAR</small></div>}{dex&&<Pokedex content={content} onClose={()=>setDex(false)}/>}</div>
}

createRoot(document.getElementById('root')).render(<App/>);
