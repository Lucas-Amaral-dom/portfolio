import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";

// ─── DOM ─────────────────────────────────────────────────────────────────────
const mapEl       = document.querySelector("#map");
const speechEl    = document.querySelector("#speech");
const enterBtn    = document.querySelector("#enterBtn");
const panelTitle  = document.querySelector("#panelTitle");
const roomPanel   = document.querySelector("#roomPanel");
const exitRoomBtn = document.querySelector("#exitRoomBtn");
const appEl       = document.querySelector("body");
const editToggle  = document.querySelector("#editToggle");
const saveBtn     = document.querySelector("#saveBtn");
const resetBtn    = document.querySelector("#resetBtn");
const toast       = document.querySelector("#toast");

const storageKey = "portfolio-rpg-senai-v3";

// ─── CLAMP HELPER (fixes k.Math.clamp which doesn't exist in Kaboom 3000) ────
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ─── MAP DATA ────────────────────────────────────────────────────────────────
const TILE = 32;
const ROWS = 22;
const COLS = 28;

const layout = [
  "tttttttttttttttttttttttttttt",
  "tggggggggggggggggggggggggggt",
  "tggggggggggggggggggggggggggt",
  "tggggggggggggggggggggggggggt",
  "tgrrrrrrrrrrrrrrrrrrrrrrrrgt",
  "tgrffgllggggggllgggllggffrgt",
  "tgrgwwwwwwggggwwwwwwggggrgt",
  "tgrgwwwwwwggggwwwwwwsggrgt",
  "tgrrrrpppprrrrrrrrrrrrrrrgt",
  "tgfgggppppggggggggggggggggt",
  "tgggggppppggggggggggggggggt",
  "tgglggppppgglggggggggllgggt",
  "tgggggppppggggggggggggggggt",
  "tgrrrrrrrrrrrrrrrrrrrrrrrrgt",
  "tgrffgllggggggllgggllggffrgt",
  "tgrgwwwwwwggggwwwwwwggggrgt",
  "tgrgwwwwwwggggwwwwwwsggrgt",
  "tgrrrrpppprrrrrrrrrrrrrrrgt",
  "tgfgggppppgggggggggggggggt",
  "tgggggppppgggggggggggggggt",
  "tggggggggggggggggggggggggggt",
  "tttttttttttttttttttttttttttt",
];

const buildings = [
  { kind: "about",    title: "Casa Sobre Mim",    label: "SOBRE",    x: 1,  y: 1,  w: 5, h: 4, doorX: 3,  doorY: 4,  speech: "Casa Sobre Mim. Aperte Entrar!" },
  { kind: "skills",   title: "Lab SENAI",          label: "SENAI",    x: 10, y: 1,  w: 5, h: 4, doorX: 12, doorY: 4,  speech: "Laboratório SENAI. Aperte Entrar!" },
  { kind: "projects", title: "Arena de Projetos",  label: "PROJETOS", x: 20, y: 1,  w: 5, h: 4, doorX: 22, doorY: 4,  speech: "Arena de Projetos. Aperte Entrar!" },
  { kind: "contact",  title: "Estação Contato",    label: "CONTATO",  x: 20, y: 14, w: 5, h: 4, doorX: 22, doorY: 13, speech: "Estação Contato. Aperte Entrar!" },
];

const state = { editing: false, near: null, roomOpen: false };
const defaultContent = {};

// ─── KABOOM (fullscreen) ─────────────────────────────────────────────────────
const k = kaboom({
  root: mapEl,
  width:  COLS * TILE,
  height: ROWS * TILE,
  background: [142, 208, 115],
  global: false,
  crisp: true,
  stretch: true,
  letterbox: false,
  debug: false,
});

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  ink:    k.rgb(21,  27,  40),
  grass:  k.rgb(142, 208, 115),
  grass2: k.rgb(101, 184, 94),
  road:   k.rgb(218, 197, 158),
  road2:  k.rgb(236, 215, 174),
  water:  k.rgb(89,  174, 226),
  water2: k.rgb(184, 232, 255),
  tree:   k.rgb(47,  142, 85),
  trunk:  k.rgb(126, 82,  53),
  flower: k.rgb(240, 90,  121),
  lamp:   k.rgb(255, 228, 119),
  door:   k.rgb(126, 82,  53),
};

// ─── ASSETS ──────────────────────────────────────────────────────────────────
k.loadSprite("about",    "assets/center.jpg");
k.loadSprite("skills",   "assets/lab.jpg");
k.loadSprite("projects", "assets/gym.jpg");
k.loadSprite("contact",  "assets/mart.jpg");

k.loadSprite("player", "assets/spritesheet.png", {
  sliceX: 39,
  sliceY: 31,
  anims: {
    "idle-down":  { from: 936,  to: 936 },
    "walk-down":  { from: 936,  to: 939,  loop: true, speed: 8 },
    "idle-side":  { from: 975,  to: 975 },
    "walk-side":  { from: 975,  to: 978,  loop: true, speed: 8 },
    "idle-up":    { from: 1014, to: 1014 },
    "walk-up":    { from: 1014, to: 1017, loop: true, speed: 8 },
  },
});

// ─── SCENE ───────────────────────────────────────────────────────────────────
k.scene("main", () => {

  // Draw tiles
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      drawTile((layout[row] || "")[col] || "g", col, row);
    }
  }

  // Draw buildings + static collision bodies
  buildings.forEach((b) => {
    drawBuilding(b);
    for (let row = b.y; row < b.y + b.h; row++) {
      for (let col = b.x; col < b.x + b.w; col++) {
        // skip the door row so player can walk up to it
        if (row === b.doorY) continue;
        k.add([
          k.rect(TILE, TILE),
          k.pos(col * TILE, row * TILE),
          k.area(),
          k.body({ isStatic: true }),
          k.opacity(0),
          k.z(5),
        ]);
      }
    }
    // Invisible door trigger
    k.add([
      k.rect(b.w * TILE, TILE),
      k.pos(b.x * TILE, b.doorY * TILE),
      k.area(),
      k.opacity(0),
      k.z(6),
      `door_${b.kind}`,
    ]);
  });

  // Map border walls
  for (let row = 0; row < ROWS; row++) {
    addWall(0, row); addWall(COLS - 1, row);
  }
  for (let col = 0; col < COLS; col++) {
    addWall(col, 0); addWall(col, ROWS - 1);
  }

  // Water collision
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if ((layout[row] || "")[col] === "w") {
        k.add([
          k.rect(TILE, TILE), k.pos(col * TILE, row * TILE),
          k.area(), k.body({ isStatic: true }), k.opacity(0), k.z(3),
        ]);
      }
    }
  }

  // ── Player ────────────────────────────────────────────────────────────────
  const player = k.add([
    k.sprite("player", { anim: "idle-down" }),
    k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
    k.body(),
    k.anchor("center"),
    k.pos(6 * TILE, 10 * TILE),
    k.scale(2),
    k.z(40),
    { speed: 200, direction: "down", isInDialogue: false },
    "playerTag",
  ]);

  // ── Camera ────────────────────────────────────────────────────────────────
  const halfW = k.width()  / 2;
  const halfH = k.height() / 2;
  const maxCX = COLS * TILE - halfW;
  const maxCY = ROWS * TILE - halfH;

  k.onUpdate(() => {
    k.camPos(
      clamp(player.pos.x, halfW, maxCX),
      clamp(player.pos.y, halfH, maxCY)
    );
  });

  // ── Door triggers ─────────────────────────────────────────────────────────
  buildings.forEach((b) => {
    player.onCollide(`door_${b.kind}`, () => {
      if (!state.roomOpen) setNearBuilding(b);
    });
    player.onCollideEnd(`door_${b.kind}`, () => {
      if (!state.roomOpen && state.near?.kind === b.kind) setNearBuilding(null);
    });
  });

  // ── Keyboard smooth movement ───────────────────────────────────────────────
  k.onKeyDown(() => {
    if (state.roomOpen) return;
    const r = k.isKeyDown("right") || k.isKeyDown("d");
    const l = k.isKeyDown("left")  || k.isKeyDown("a");
    const u = k.isKeyDown("up")    || k.isKeyDown("w");
    const d = k.isKeyDown("down")  || k.isKeyDown("s");

    if (r) { player.flipX=false; playAnim(player,"walk-side"); player.direction="right"; player.move(player.speed,0); }
    else if (l) { player.flipX=true; playAnim(player,"walk-side"); player.direction="left"; player.move(-player.speed,0); }
    else if (u) { playAnim(player,"walk-up"); player.direction="up"; player.move(0,-player.speed); }
    else if (d) { playAnim(player,"walk-down"); player.direction="down"; player.move(0,player.speed); }
    else stopAnims(player);
  });

  k.onKeyRelease(() => stopAnims(player));

  // ── Click / tap to move ───────────────────────────────────────────────────
  k.onMouseDown((btn) => {
    if (btn !== "left" || state.roomOpen) return;
    const world = k.toWorld(k.mousePos());
    player.moveTo(world, player.speed);
    const angle = player.pos.angle(world);
    if      (angle > 50 && angle < 125)  { playAnim(player,"walk-up");   player.direction="up"; }
    else if (angle < -50 && angle > -125){ playAnim(player,"walk-down"); player.direction="down"; }
    else if (Math.abs(angle) > 125)      { player.flipX=false; playAnim(player,"walk-side"); player.direction="right"; }
    else                                  { player.flipX=true;  playAnim(player,"walk-side"); player.direction="left"; }
  });
  k.onMouseRelease(() => stopAnims(player));

  // ── Enter / Escape ────────────────────────────────────────────────────────
  k.onKeyPress("enter",  () => { if (state.near && !state.roomOpen) enterBuilding(state.near.kind); });
  k.onKeyPress("escape", () => { if (state.roomOpen) exitRoom(); });

  // ── D-pad buttons ─────────────────────────────────────────────────────────
  document.querySelectorAll("[data-move]").forEach((btn) => {
    let iv = null;
    const dir = btn.dataset.move;
    const doMove = () => {
      if (state.roomOpen) return;
      const vx = dir==="right"?1: dir==="left"?-1:0;
      const vy = dir==="down"?1:  dir==="up"  ?-1:0;
      if (vx) { player.flipX=vx<0; playAnim(player,"walk-side"); player.direction=vx>0?"right":"left"; player.move(player.speed*vx,0); }
      if (vy) { const a=vy<0?"walk-up":"walk-down"; playAnim(player,a); player.direction=vy<0?"up":"down"; player.move(0,player.speed*vy); }
    };
    const start = (e) => { if(e.cancelable) e.preventDefault(); doMove(); iv=setInterval(doMove,80); };
    const stop  = ()  => { clearInterval(iv); stopAnims(player); };
    btn.addEventListener("mousedown",  start);
    btn.addEventListener("touchstart", start, { passive: false });
    btn.addEventListener("mouseup",    stop);
    btn.addEventListener("mouseleave", stop);
    btn.addEventListener("touchend",   stop);
  });
});

k.go("main");

// ─── ANIMATION HELPERS ────────────────────────────────────────────────────────
function playAnim(player, anim) {
  if (player.curAnim() !== anim) player.play(anim);
}
function stopAnims(player) {
  const idle = { down:"idle-down", up:"idle-up", left:"idle-side", right:"idle-side" }[player.direction] || "idle-down";
  playAnim(player, idle);
}
function addWall(col, row) {
  k.add([k.rect(TILE,TILE), k.pos(col*TILE,row*TILE), k.area(), k.body({isStatic:true}), k.opacity(0)]);
}

// ─── TILE RENDERER ────────────────────────────────────────────────────────────
function drawTile(ch, col, row) {
  const px=col*TILE, py=row*TILE;
  const base = ch==="r"?C.road: ch==="w"?C.water: C.grass;
  k.add([k.rect(TILE,TILE), k.pos(px,py), k.color(base), k.z(0)]);
  if (ch==="g") { k.add([k.rect(5,5),k.pos(px+6,py+8),k.color(170,226,122),k.z(1)]); k.add([k.rect(4,4),k.pos(px+22,py+20),k.color(110,190,90),k.z(1)]); }
  if (ch==="r") { k.add([k.rect(TILE,4),k.pos(px,py+14),k.color(C.road2),k.z(1)]); }
  if (ch==="w") { k.add([k.rect(20,3),k.pos(px+6,py+8),k.color(C.water2),k.z(1)]); k.add([k.rect(16,3),k.pos(px+10,py+22),k.color(44,139,204),k.z(1)]); }
  if (ch==="t") { k.add([k.rect(TILE,TILE),k.pos(px,py),k.color(C.grass2),k.z(2)]); k.add([k.rect(10,18),k.pos(px+11,py+13),k.color(C.trunk),k.z(3)]); k.add([k.rect(24,21),k.pos(px+4,py+3),k.color(C.tree),k.outline(3,C.ink),k.z(4)]); }
  if (ch==="f") { k.add([k.rect(5,5),k.pos(px+8,py+10),k.color(C.flower),k.z(3)]); k.add([k.rect(5,5),k.pos(px+18,py+20),k.color(255,241,121),k.z(3)]); }
  if (ch==="s") { k.add([k.rect(20,14),k.pos(px+6,py+6),k.color(243,210,134),k.outline(3,C.trunk),k.z(4)]); k.add([k.rect(5,14),k.pos(px+14,py+18),k.color(C.trunk),k.z(3)]); }
  if (ch==="l") { k.add([k.rect(5,19),k.pos(px+14,py+11),k.color(C.ink),k.z(4)]); k.add([k.rect(16,12),k.pos(px+9,py+4),k.color(C.lamp),k.outline(3,C.ink),k.z(5)]); }
  if (ch==="p") { k.add([k.rect(TILE,7),k.pos(px,py+12),k.color(156,105,65),k.outline(2,C.trunk),k.z(4)]); }
}

// ─── BUILDING RENDERER ────────────────────────────────────────────────────────
function drawBuilding(b) {
  const px=b.x*TILE, py=b.y*TILE, bw=b.w*TILE, bh=b.h*TILE;
  const imgScale = (bw * 1.1) / 1024;
  k.add([k.sprite(b.kind), k.pos(px - bw*0.05, py - TILE*0.8), k.scale(imgScale), k.z(12)]);
  k.add([k.rect(bw,6), k.pos(px, py+bh), k.color(0,0,0), k.opacity(0.15), k.z(11)]);
  k.add([k.rect(TILE*1.6, TILE*0.3), k.pos(b.doorX*TILE - TILE*0.3, b.doorY*TILE + TILE*0.65), k.color(C.door), k.z(6)]);
}

// ─── UI ────────────────────────────────────────────────────────────────────────
function setNearBuilding(b) {
  state.near = b || null;
  enterBtn.classList.toggle("show", Boolean(b));
  speechEl.textContent = b
    ? b.speech
    : "Explore a cidade. Vá até a porta de um prédio e aperte Entrar.";
}

function enterBuilding(kind) {
  const b = buildings.find(x => x.kind === kind);
  if (!b) return;
  state.roomOpen = true;
  roomPanel.classList.add("open");
  roomPanel.setAttribute("aria-hidden", "false");
  document.querySelectorAll(".section").forEach(s =>
    s.classList.toggle("active", s.id === kind)
  );
  panelTitle.textContent = b.title;
  speechEl.textContent = "Você entrou. Use Sair para voltar ao mapa.";
}

function exitRoom() {
  state.roomOpen = false;
  roomPanel.classList.remove("open");
  roomPanel.setAttribute("aria-hidden", "true");
  setNearBuilding(state.near);
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
}

// ─── CONTENT EDITING ─────────────────────────────────────────────────────────
function captureDefaults() {
  document.querySelectorAll("[data-key]").forEach(n => {
    defaultContent[n.dataset.key] = n.innerHTML;
  });
}

function loadContent() {
  const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
  document.querySelectorAll("[data-key]").forEach(n => {
    if (saved[n.dataset.key]) n.innerHTML = saved[n.dataset.key];
  });
  syncContactLinks();
}

function saveContent() {
  const data = {};
  document.querySelectorAll("[data-key]").forEach(n => {
    data[n.dataset.key] = n.innerHTML.trim();
  });
  localStorage.setItem(storageKey, JSON.stringify(data));
  syncContactLinks();
  showToast("Textos salvos!");
}

function resetContent() {
  localStorage.removeItem(storageKey);
  document.querySelectorAll("[data-key]").forEach(n => {
    n.innerHTML = defaultContent[n.dataset.key];
  });
  syncContactLinks();
  showToast("Conteúdo restaurado.");
}

function setEditing(on) {
  state.editing = on;
  appEl.classList.toggle("editing", on);
  editToggle.classList.toggle("active", on);
  editToggle.textContent = on ? "✏ Editando" : "✏ Editar";
  document.querySelectorAll(".editable").forEach(n => {
    n.contentEditable = on ? "true" : "false";
  });
  showToast(on ? "Modo edição ligado." : "Modo edição desligado.");
}

function syncContactLinks() {
  const email    = document.querySelector('[data-key="contactEmail"]');
  const linkedin = document.querySelector('[data-key="contactLinkedin"]');
  const github   = document.querySelector('[data-key="contactGithub"]');
  if (email) {
    const t = email.textContent.replace("↗","").trim();
    email.href = t.includes("@") ? `mailto:${t}` : "#";
  }
  if (linkedin) linkedin.href = linkedin.textContent.includes("http")
    ? linkedin.textContent.replace("↗","").trim() : "https://www.linkedin.com/";
  if (github) github.href = github.textContent.includes("http")
    ? github.textContent.replace("↗","").trim() : "https://github.com/";
}

// ─── GLOBAL EVENTS ────────────────────────────────────────────────────────────
document.addEventListener("keydown", e => {
  if (state.editing && e.target.closest("[contenteditable='true']")) return;
  if (e.key === "Enter"  && state.near && !state.roomOpen) { e.preventDefault(); enterBuilding(state.near.kind); }
  if (e.key === "Escape" && state.roomOpen) { e.preventDefault(); exitRoom(); }
});

editToggle.addEventListener("click",  () => setEditing(!state.editing));
enterBtn.addEventListener("click",    () => state.near && enterBuilding(state.near.kind));
exitRoomBtn.addEventListener("click", exitRoom);
saveBtn.addEventListener("click",     saveContent);
resetBtn.addEventListener("click",    resetContent);
document.addEventListener("input",    e => { if (e.target.matches(".editable")) syncContactLinks(); });

// ─── BOOT ─────────────────────────────────────────────────────────────────────
captureDefaults();
loadContent();