// 🚀 3Dシューティングパラメータ（400px拡張＋ハードロックBGMチューニング版）
const CANVAS_W_3D = 400;
const CANVAS_H_3D = 240;
const VIEW_H_3D = 190;
const SCREEN_W_3D = 400;
const SCREEN_H_3D = 240;

const MAX_HP_3D = 200;
const MAX_AMMO_3D = 100;
const RECOVER_AMMO_3D = 10;

let playerAngle3D = 0;
let hp3D = MAX_HP_3D;
let ammo3D = MAX_AMMO_3D;
let score3D = 0;
let isGameOver3D = false;
let damageFlashTimer3D = 0;
let animFrame3D = 0;

const crosshair3D = { x: CANVAS_W_3D / 2, y: VIEW_H_3D / 2, speed: 4 };
const input3D = { left: false, right: false, up: false, down: false };

let bgmTimer3D = null;
let bgmStep3D = 0;

// 🎸 「神々の黄昏」風 疾走ハードロックメロディ＆パワーコード設定
// メインリード（sawtooth波でディストーションギター風）
const bgmMelody3D = [
  220, 220, 261, 293,  329, 293, 261, 220,  196, 220, 261, 220,  196, 174, 196, 207,
  220, 220, 261, 293,  349, 329, 293, 261,  293, 329, 349, 392,  440, 392, 349, 329
];

// パワーコード（5度上の音を重ねて重厚感を出す）
const bgmFifth3D = bgmMelody3D.map(f => f > 0 ? f * 1.5 : 0);

// ドライブ感のある高速8分ルートベース（A -> C -> G -> F -> E）
const bgmBass3D = [
  110, 110, 110, 110,  110, 110, 110, 110,  130, 130, 130, 130,  98,  98,  103, 103,
  110, 110, 110, 110,  110, 110, 110, 110,  146, 146, 146, 146,  164, 164, 164, 164
];

function stopBGM3D() {
    if (bgmTimer3D) clearInterval(bgmTimer3D);
}

function startBGM3D() {
  stopBGM3D();
  bgmStep3D = 0;
  // BPM160相当の高速テンポ（約93ms間隔）
  bgmTimer3D = setInterval(() => {
    if (!audioCtx || audioCtx.state === 'suspended' || isGameOver3D || currentMode !== '3D') return;
    const now = audioCtx.currentTime;
    const idx = bgmStep3D % bgmMelody3D.length;

    // 1. ディストーションリードギター（sawtooth波）
    const freq = bgmMelody3D[idx];
    if (freq > 0) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.085);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    }

    // 2. パワーコード用のハーモニー（5度上の和音で厚みアップ）
    const freqFifth = bgmFifth3D[idx];
    if (freqFifth > 0) {
      const oscF = audioCtx.createOscillator();
      const gainF = audioCtx.createGain();
      oscF.type = 'sawtooth';
      oscF.frequency.setValueAtTime(freqFifth, now);
      gainF.gain.setValueAtTime(0.03, now);
      gainF.gain.exponentialRampToValueAtTime(0.003, now + 0.085);
      oscF.connect(gainF);
      gainF.connect(audioCtx.destination);
      oscF.start(now);
      oscF.stop(now + 0.085);
    }

    // 3. ドライブベース（triangle波で太いルート音）
    const bassFreq = bgmBass3D[idx];
    if (bassFreq > 0) {
      const bOsc = audioCtx.createOscillator();
      const bGain = audioCtx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bassFreq, now);
      bGain.gain.setValueAtTime(0.14, now);
      bGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
      bOsc.connect(bGain);
      bGain.connect(audioCtx.destination);
      bOsc.start(now);
      bOsc.stop(now + 0.09);
    }

    // 4. 高速ドラムビート（スネア＆ノイズハイハット）
    const bufferSize = audioCtx.sampleRate * 0.025;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const nGain = audioCtx.createGain();
    
    // スネア（2拍・4拍目）とハイハット（刻み）
    const isSnare = (bgmStep3D % 4 === 2);
    nGain.gain.setValueAtTime(isSnare ? 0.08 : 0.025, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    
    noise.connect(nGain);
    nGain.connect(audioCtx.destination);
    noise.start(now);

    bgmStep3D++;
  }, 93);
}

function playSE3D(type) {
  if (!audioCtx || audioCtx.state === 'suspended') return;
  const now = audioCtx.currentTime;
  if (type === 'shoot') {
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.08);
  } else if (type === 'hit') {
    const bufferSize = audioCtx.sampleRate * 0.1; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.setValueAtTime(1200, now); filter.Q.setValueAtTime(1.2, now);
    const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); noise.start(now);

    const osc = audioCtx.createOscillator(); const oscGain = audioCtx.createGain();
    osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    oscGain.gain.setValueAtTime(0.4, now); oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(oscGain); oscGain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.08);

    const steps = [0.06, 0.12, 0.18, 0.24];
    steps.forEach((delay, idx) => {
      const sOsc = audioCtx.createOscillator(); const sGain = audioCtx.createGain();
      sOsc.type = 'square'; sOsc.frequency.setValueAtTime(700 + (idx % 2 === 0 ? 100 : 0), now + delay);
      sGain.gain.setValueAtTime(0.12, now + delay); sGain.gain.exponentialRampToValueAtTime(0.005, now + delay + 0.04);
      sOsc.connect(sGain); sGain.connect(audioCtx.destination); sOsc.start(now + delay); sOsc.stop(now + delay + 0.04);
    });
  } else if (type === 'damage') {
    const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(160, now); osc.frequency.linearRampToValueAtTime(50, now + 0.2);
    gain.gain.setValueAtTime(0.4, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.2);
  } else if (type === 'gameover') {
    const freqs = [220, 207, 196, 185];
    freqs.forEach((f, idx) => {
      const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
      osc.type = 'triangle'; osc.frequency.setValueAtTime(f, now + idx * 0.18); gain.gain.setValueAtTime(0.3, now + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.18 + 0.2);
      osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now + idx * 0.18); osc.stop(now + idx * 0.18 + 0.2);
    });
  }
}

const rawImg3D = new Image();
rawImg3D.crossOrigin = "Anonymous";
rawImg3D.src = 'https://raw.githubusercontent.com/motteli81/motteli81/refs/heads/main/1789407167801.png';
let processedCanvas3D = null;
let imageLoaded3D = false;
const FRAME_COLS_3D = 5;
const FRAME_ROWS_3D = 4;

rawImg3D.onload = () => {
  const offCanvas = document.createElement('canvas'); offCanvas.width = rawImg3D.width; offCanvas.height = rawImg3D.height;
  const offCtx = offCanvas.getContext('2d'); offCtx.drawImage(rawImg3D, 0, 0);
  const imgData = offCtx.getImageData(0, 0, rawImg3D.width, rawImg3D.height); const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    if (g > 110 && r < 140 && b < 140 && g > r * 1.1) data[i + 3] = 0;
  }
  offCtx.putImageData(imgData, 0, 0); processedCanvas3D = offCanvas; imageLoaded3D = true;
};

// 🐹 敵データ初期化（各敵に耐久力 hp: 3 を設定）
const enemies3D = [];
for (let i = 0; i < 4; i++) {
  const enemy = { alive: false, escaping: false, escapeTimer: 0, hp: 3 };
  resetEnemy3D(enemy); enemy.alive = true; enemies3D.push(enemy);
}

function restartGame3D() {
  initAudio(); hp3D = MAX_HP_3D; ammo3D = MAX_AMMO_3D; score3D = 0; playerAngle3D = 0;
  isGameOver3D = false; damageFlashTimer3D = 0; crosshair3D.x = CANVAS_W_3D / 2; crosshair3D.y = VIEW_H_3D / 2;
  enemies3D.forEach(enemy => { resetEnemy3D(enemy); enemy.alive = true; });
  if (soundEnabled) startBGM3D();
}

function bindBtn3D(id, keyName) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = (e) => { initAudio(); e.preventDefault(); input3D[keyName] = true; el.classList.add('active'); };
  const end = (e) => { e.preventDefault(); input3D[keyName] = false; el.classList.remove('active'); };
  el.addEventListener('touchstart', start); el.addEventListener('touchend', end);
  el.addEventListener('mousedown', start); el.addEventListener('mouseup', end); el.addEventListener('mouseleave', end);
}

bindBtn3D('btn-3d-left', 'left'); bindBtn3D('btn-3d-right', 'right');
bindBtn3D('btn-up', 'up'); bindBtn3D('btn-down', 'down');

const fireBtn3D = document.getElementById('btn-fire');
if (fireBtn3D) {
  const triggerShoot3D = (e) => {
    initAudio(); e.preventDefault();
    if (isGameOver3D) restartGame3D();
    else shoot3D();
  };
  fireBtn3D.addEventListener('touchstart', triggerShoot3D);
  fireBtn3D.addEventListener('mousedown', triggerShoot3D);
}

function handleCanvasTouch3D(e) {
  if (currentMode !== '3D') return;
  initAudio(); e.preventDefault();
  if (isGameOver3D) { restartGame3D(); return; }
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  const scaleX = SCREEN_W_3D / rect.width; const scaleY = SCREEN_H_3D / rect.height;
  const touchX = (touch.clientX - rect.left) * scaleX; const touchY = (touch.clientY - rect.top) * scaleY;
  if (touchY < VIEW_H_3D) {
    crosshair3D.x = Math.max(10, Math.min(CANVAS_W_3D - 10, touchX));
    crosshair3D.y = Math.max(10, Math.min(VIEW_H_3D - 10, touchY));
  }
}
canvas.addEventListener('touchmove', (e) => { if (currentMode === '3D') handleCanvasTouch3D(e); });
canvas.addEventListener('touchstart', (e) => { if (currentMode === '3D') { handleCanvasTouch3D(e); if (!isGameOver3D) shoot3D(); } });

window.addEventListener("keydown", e => {
  if (currentMode !== '3D') return;
  initAudio();
  if (isGameOver3D && e.code === "Space") { restartGame3D(); return; }
  if (e.code === "ArrowLeft" || e.code === "KeyA") input3D.left = true;
  if (e.code === "ArrowRight" || e.code === "KeyD") input3D.right = true;
  if (e.code === "ArrowUp" || e.code === "KeyW") input3D.up = true;
  if (e.code === "ArrowDown" || e.code === "KeyS") input3D.down = true;
  if (e.code === "Space") shoot3D();
});
window.addEventListener("keyup", e => {
  if (currentMode !== '3D') return;
  if (e.code === "ArrowLeft" || e.code === "KeyA") input3D.left = false;
  if (e.code === "ArrowRight" || e.code === "KeyD") input3D.right = false;
  if (e.code === "ArrowUp" || e.code === "KeyW") input3D.up = false;
  if (e.code === "ArrowDown" || e.code === "KeyS") input3D.down = false;
});

function shoot3D() {
  if (isGameOver3D || ammo3D <= 0) return;
  ammo3D--; playSE3D('shoot');
  enemies3D.forEach(enemy => {
    if (!enemy.alive || enemy.escaping) return;
    const screenPos = getScreenPos3D(enemy); if (!screenPos.visible) return;
    const halfW = screenPos.drawW / 2; const halfH = screenPos.drawH / 2;
    if (crosshair3D.x >= screenPos.x - halfW && crosshair3D.x <= screenPos.x + halfW &&
        crosshair3D.y >= screenPos.y - halfH && crosshair3D.y <= screenPos.y + halfH) {
      
      // 🎯 1発当たるごとにHPを減らす
      enemy.hp--;
      playSE3D('hit');

      // 🎯 3発ヒット（HPが0）したら撃破（逃走アニメーションへ）
      if (enemy.hp <= 0) {
        enemy.escaping = true; 
        enemy.escapeTimer = 40; 
        score3D += 100; 
        ammo3D = Math.min(MAX_AMMO_3D, ammo3D + RECOVER_AMMO_3D);
      }
    }
  });
}


function resetEnemy3D(enemy) {
  enemy.z = 500 + Math.random() * 200; 
  enemy.y = 0; 
  enemy.escaping = false; 
  enemy.escapeTimer = 0; 
  enemy.hp = 3; // 🎯 湧いた時にHPを3にリセット
  enemy.speed = 1.2 + Math.random() * 0.4;
  
  const moveType = Math.floor(Math.random() * 3);
  if (moveType === 0) { enemy.angle = (playerAngle3D + 25 + Math.random() * 20) % 360; enemy.vAngle = -0.35; enemy.dir = 'LEFT'; }
  else if (moveType === 1) { enemy.angle = (playerAngle3D - 25 - Math.random() * 20 + 360) % 360; enemy.vAngle = 0.35; enemy.dir = 'RIGHT'; }
  else { enemy.angle = (playerAngle3D + (Math.random() * 20 - 10) + 360) % 360; enemy.vAngle = 0; enemy.dir = 'FRONT'; }
}

function getScreenPos3D(enemy) {
  let diffAngle = enemy.angle - playerAngle3D;
  while (diffAngle < -180) diffAngle += 360; while (diffAngle > 180) diffAngle -= 360;
  if (Math.abs(diffAngle) > 45) return { visible: false };
  const focalLength = 180; const scale = focalLength / enemy.z;
  const screenX = (CANVAS_W_3D / 2) + (diffAngle * 4.5);
  const runBob = Math.abs(Math.sin((animFrame3D * 0.12) + enemy.angle)) * 3;
  const screenY = (VIEW_H_3D / 2) + ((enemy.y - runBob) * scale);
  const size = Math.max(16, 110 * scale);
  const frameW = imageLoaded3D ? processedCanvas3D.width / FRAME_COLS_3D : 1;
  const frameH = imageLoaded3D ? processedCanvas3D.height / FRAME_ROWS_3D : 1;
  const aspect = frameH / frameW;
  return { x: screenX, y: screenY, drawW: size, drawH: size * aspect, visible: true, enemyRef: enemy };
}

function drawEnemySprite3D(pos) {
  if (!imageLoaded3D) return;
  const enemy = pos.enemyRef; const frameW = processedCanvas3D.width / FRAME_COLS_3D; const frameH = processedCanvas3D.height / FRAME_ROWS_3D;
  let col = 0; let row = 0; let flipX = false;
  if (enemy.escaping) { const backFrames = [0, 1, 2, 3]; col = backFrames[Math.floor(animFrame3D / 4) % backFrames.length]; row = 3; }
  else if (enemy.z < 90) { col = 2; row = 0; }
  else if (enemy.dir === 'FRONT') {
    const frontSequence = [{ row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 }, { row: 1, col: 4 }];
    const step = Math.floor(animFrame3D / 5) % frontSequence.length; col = frontSequence[step].col; row = frontSequence[step].row;
  } else {
    const sideFrames = [0, 1, 2, 3]; col = sideFrames[Math.floor(animFrame3D / 5) % sideFrames.length]; row = 2;
    if (enemy.dir === 'RIGHT') flipX = true;
  }
  const inset = 1; const srcX = col * frameW + inset; const srcY = row * frameH + inset;
  const srcW = frameW - (inset * 2); const srcH = frameH - (inset * 2);
  ctx.save(); ctx.translate(pos.x, pos.y); if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(processedCanvas3D, srcX, srcY, srcW, srcH, -pos.drawW / 2, -pos.drawH / 2, pos.drawW, pos.drawH);
  ctx.restore();
}

function drawSunflowerSeed3D(x, y, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = "#3a2312"; ctx.beginPath(); ctx.ellipse(0, 0, 4, 7, Math.PI / 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f4f1de"; ctx.fillRect(-1, -4, 1.5, 8); ctx.restore();
}

function drawCompass3D() {
  const compassX = 220; const compassY = VIEW_H_3D + 25; const compassWidth = 120;
  ctx.fillStyle = "#111"; ctx.fillRect(compassX - compassWidth/2, compassY - 10, compassWidth, 20);
  ctx.strokeStyle = "#888"; ctx.strokeRect(compassX - compassWidth/2, compassY - 10, compassWidth, 20);
  const directions = [{ name: "N", angle: 0 }, { name: "NE", angle: 45 }, { name: "E", angle: 90 }, { name: "SE", angle: 135 }, { name: "S", angle: 180 }, { name: "SW", angle: 225 }, { name: "W", angle: 270 }, { name: "NW", angle: 315 }];
  ctx.save(); ctx.beginPath(); ctx.rect(compassX - compassWidth/2 + 2, compassY - 8, compassWidth - 4, 16); ctx.clip();
  ctx.fillStyle = "#00ffcc"; ctx.font = "10px monospace"; ctx.textAlign = "center";
  directions.forEach(dir => {
    let diff = dir.angle - playerAngle3D; while (diff < -180) diff += 360; while (diff > 180) diff -= 360;
    ctx.fillText(dir.name, compassX + (diff * 1.5), compassY + 4);
  });
  ctx.restore();
  ctx.fillStyle = "#ff0055"; ctx.beginPath(); ctx.moveTo(compassX, compassY - 10); ctx.lineTo(compassX - 4, compassY - 15); ctx.lineTo(compassX + 4, compassY - 15); ctx.fill();
}

function update3D() {
  if (isGameOver3D) return;
  animFrame3D++; if (damageFlashTimer3D > 0) damageFlashTimer3D--;
  if (input3D.left) playerAngle3D = (playerAngle3D - 2.5 + 360) % 360;
  if (input3D.right) playerAngle3D = (playerAngle3D + 2.5) % 360;
  if (input3D.up && crosshair3D.y > 10) crosshair3D.y -= crosshair3D.speed;
  if (input3D.down && crosshair3D.y < VIEW_H_3D - 10) crosshair3D.y += crosshair3D.speed;

  enemies3D.forEach(enemy => {
    if (enemy.escaping) {
      enemy.z += 6.5; enemy.escapeTimer--;
      if (enemy.z > 900 || enemy.escapeTimer <= 0) { enemy.escaping = false; enemy.alive = false; resetEnemy3D(enemy); enemy.alive = true; }
      return;
    }
    if (!enemy.alive) return;
    enemy.angle = (enemy.angle + enemy.vAngle + 360) % 360; enemy.z -= enemy.speed;
    if (enemy.z < 50) {
      hp3D -= 20; damageFlashTimer3D = 8; playSE3D('damage');
      if (hp3D <= 0) { hp3D = 0; isGameOver3D = true; playSE3D('gameover'); }
      resetEnemy3D(enemy); enemy.alive = true;
    }
  });

  if (score3D >= 2000) {
      end3DMode();
  }
}

function draw3D() {
  ctx.fillStyle = "#112244"; ctx.fillRect(0, 0, CANVAS_W_3D, VIEW_H_3D / 2);
  ctx.fillStyle = "#224422"; ctx.fillRect(0, VIEW_H_3D / 2, CANVAS_W_3D, VIEW_H_3D / 2);
  ctx.strokeStyle = "#44aa44"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, VIEW_H_3D / 2); ctx.lineTo(CANVAS_W_3D, VIEW_H_3D / 2); ctx.stroke();

  const renderList = [...enemies3D].sort((a, b) => b.z - a.z);
  renderList.forEach(enemy => {
    if (!enemy.alive) return;
    const pos = getScreenPos3D(enemy); if (!pos.visible) return;
    if (imageLoaded3D) drawEnemySprite3D(pos);
    else { ctx.fillStyle = "#e63946"; ctx.fillRect(pos.x - pos.drawW / 2, pos.y - pos.drawH / 2, pos.drawW, pos.drawH); }
  });

  if (damageFlashTimer3D > 0) { ctx.fillStyle = "rgba(255, 0, 0, 0.4)"; ctx.fillRect(0, 0, CANVAS_W_3D, VIEW_H_3D); }

  if (!isGameOver3D) {
    ctx.strokeStyle = "#ffb703"; ctx.lineWidth = 1.5; ctx.strokeRect(crosshair3D.x - 10, crosshair3D.y - 10, 20, 20);
    drawSunflowerSeed3D(crosshair3D.x, crosshair3D.y, 0.8);
  }

  ctx.fillStyle = "#000"; ctx.fillRect(0, VIEW_H_3D, CANVAS_W_3D, SCREEN_H_3D - VIEW_H_3D);
  ctx.fillStyle = "#fff"; ctx.font = "10px monospace"; ctx.fillText(`SCORE: ${String(score3D).padStart(6, '0')}`, 10, VIEW_H_3D + 13);
  ctx.fillText(`SEEDS: ${String(ammo3D).padStart(3, ' ')} / ${MAX_AMMO_3D}`, 10, VIEW_H_3D + 26);
  drawSunflowerSeed3D(92, VIEW_H_3D + 23, 0.7);

  ctx.fillText(`HP:`, 10, VIEW_H_3D + 39); const hpBarW = 60; const hpRatio = hp3D / MAX_HP_3D;
  ctx.fillStyle = "#333"; ctx.fillRect(32, VIEW_H_3D + 32, hpBarW, 7);
  ctx.fillStyle = hp3D > 60 ? "#2ec4b6" : (hp3D > 30 ? "#ffb703" : "#e63946");
  ctx.fillRect(32, VIEW_H_3D + 32, hpBarW * hpRatio, 7); ctx.strokeStyle = "#666"; ctx.strokeRect(32, VIEW_H_3D + 32, hpBarW, 7);

  drawCompass3D();

  if (isGameOver3D) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)"; ctx.fillRect(0, 0, CANVAS_W_3D, VIEW_H_3D);
    ctx.fillStyle = "#e63946"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center"; ctx.fillText("GAME OVER", CANVAS_W_3D / 2, VIEW_H_3D / 2 - 10);
    ctx.fillStyle = "#ffffff"; ctx.font = "11px monospace"; ctx.fillText("TAP OR PRESS FIRE TO RETRY", CANVAS_W_3D / 2, VIEW_H_3D / 2 + 15); ctx.textAlign = "left";
  }
}

function mainLoop() {
  ctx.save();
  ctx.scale(SCALE, SCALE);

  if (currentMode === '2D') {
      update2D();
      draw2D();
  } else if (currentMode === '3D') {
      update3D();
      draw3D();
  }

  ctx.restore();
  requestAnimationFrame(mainLoop);
}

mainLoop();
