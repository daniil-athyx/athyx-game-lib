(function() {
  'use strict';

  window.cheats = {
    godmode: false,
    infiniteAmmo: false,
    infiniteMoney: false,
    noRecoil: false,
    rapidFire: false,
    oneHitKill: false,
    speedMult: 1.0,
    superJump: false,
    flight: false,
    noclip: false,
    chams: false,
    esp: false,
    freezeBots: false
  };

  let menuOpen = false;
  let espCanvas = null;
  let espCtx = null;
  let originalDamagePlayer = null;
  let originalDealDamage = null;
  let originalPlayerShoot = null;

  function hookGameEngine() {
    if (!window.game) {
      setTimeout(hookGameEngine, 100);
      return;
    }

    const game = window.game;

    if (!originalDamagePlayer && game.damagePlayer) {
      originalDamagePlayer = game.damagePlayer.bind(game);
      game.damagePlayer = function(amount, killer, isHeadshot, type) {
        if (window.cheats.godmode) {
          if (game.player) {
            game.player.health = 100;
            game.player.alive = true;
          }
          if (game.hud && game.hud.updateHealth) {
            game.hud.updateHealth();
          }
          return;
        }
        return originalDamagePlayer(amount, killer, isHeadshot, type);
      };
    }

    if (!originalDealDamage && game.dealDamage) {
      originalDealDamage = game.dealDamage.bind(game);
      game.dealDamage = function(target, dmg, hitgroup, isWallbang, weapon) {
        if (window.cheats.oneHitKill && target && target !== game.player) {
          dmg = 9999;
        }
        return originalDealDamage(target, dmg, hitgroup, isWallbang, weapon);
      };
    }

    if (!originalPlayerShoot && game.playerShoot) {
      originalPlayerShoot = game.playerShoot.bind(game);
      game.playerShoot = function(def, sx, sy) {
        if (window.cheats.noRecoil || window.cheats.rapidFire) {
          sx = 0;
          sy = 0;
          if (game.weapons) {
            cleanRecoil(game.weapons);
          }
        }
        return originalPlayerShoot(def, sx, sy);
      };
    }

    if (game.player) {
      hookPlayer(game.player);
    }

    if (game.weapons) {
      hookWeapons(game.weapons);
    }

    requestAnimationFrame(cheatTick);
  }

  function hookPlayer(player) {
    if (!player || player._cheatHooked) return;
    player._cheatHooked = true;

    const origUpdate = player.update.bind(player);
    player.update = function(dt, input) {
      const game = this.game;

      if (window.cheats.noclip && input) {
        this.vy = 0;
        this.vx = 0;
        this.vz = 0;

        const mult = (window.cheats.speedMult > 1 ? window.cheats.speedMult : 1.0);
        const speed = 20 * mult * dt;
        const yaw = this.yaw;
        const pitch = this.pitch;

        const fx = -Math.sin(yaw) * Math.cos(pitch);
        const fy = Math.sin(pitch);
        const fz = -Math.cos(yaw) * Math.cos(pitch);

        const rx = Math.cos(yaw);
        const rz = -Math.sin(yaw);

        const mouse = input.consumeMouse();
        let sens = game.sensitivity || 1.0;
        if (game.scoped) sens *= 0.5;
        this.yaw -= mouse.dx * sens;
        this.pitch -= mouse.dy * sens;
        const maxPitch = Math.PI / 2 - 0.01;
        this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));

        if (input.downA('forward')) {
          this.x += fx * speed;
          this.y += fy * speed;
          this.z += fz * speed;
        }
        if (input.downA('back')) {
          this.x -= fx * speed;
          this.y -= fy * speed;
          this.z -= fz * speed;
        }
        if (input.downA('right')) {
          this.x += rx * speed;
          this.z += rz * speed;
        }
        if (input.downA('left')) {
          this.x -= rx * speed;
          this.z -= rz * speed;
        }
        if (input.downA('jump')) {
          this.y += speed;
        }
        if (input.downA('crouch')) {
          this.y -= speed;
        }

        return;
      }

      if (window.cheats.flight && input) {
        this.vy = 0;
        const vertSpeed = 12 * (window.cheats.speedMult > 1 ? window.cheats.speedMult : 1.0) * dt;
        if (input.downA('jump')) {
          this.y += vertSpeed;
        }
        if (input.downA('crouch')) {
          this.y -= vertSpeed;
        }
      }

      origUpdate(dt, input);

      if (window.cheats.superJump && !this.onGround && this.vy > 4.5 && this.vy < 14) {
        this.vy = 18;
      }
    };
  }

  function hookWeapons(weapons) {
    if (!weapons || weapons._cheatHooked) return;
    weapons._cheatHooked = true;

    const origSpread = weapons.spread.bind(weapons);
    weapons.spread = function() {
      if (window.cheats.noRecoil || window.cheats.rapidFire) return 0;
      return origSpread();
    };

    const origCycleTime = weapons.cycleTime.bind(weapons);
    weapons.cycleTime = function() {
      if (window.cheats.rapidFire) return 0.04;
      return origCycleTime();
    };

    const origMaxSpeed = weapons.maxSpeed.bind(weapons);
    weapons.maxSpeed = function() {
      const base = origMaxSpeed();
      if (window.cheats.speedMult > 1.0) {
        return base * window.cheats.speedMult;
      }
      return base;
    };

    if (weapons.fire) {
      const origFire = weapons.fire.bind(weapons);
      weapons.fire = function() {
        origFire();
        if (window.cheats.rapidFire || window.cheats.noRecoil) {
          cleanRecoil(this);
        }
      };
    }

    if (weapons.update) {
      const origWeaponsUpdate = weapons.update.bind(weapons);
      weapons.update = function(dt, input) {
        origWeaponsUpdate(dt, input);
        if (window.cheats.rapidFire || window.cheats.noRecoil) {
          cleanRecoil(this);
        }
      };
    }
  }

  function cleanRecoil(weapons) {
    if (!weapons) return;
    weapons.punchP = 0;
    weapons.punchY = 0;
    weapons.shkP = 0;
    weapons.shkY = 0;
    weapons.shkR = 0;
    weapons.shkPV = 0;
    weapons.shkRV = 0;
    weapons.sprayP = 0;
    weapons.sprayY = 0;
    if (weapons.punch) {
      weapons.punch.aimPitch = 0;
      weapons.punch.aimYaw = 0;
      weapons.punch.velPitch = 0;
      weapons.punch.velYaw = 0;
      weapons.punch.viewPitch = 0;
      weapons.punch.viewYaw = 0;
      weapons.punch.index = 0;
      weapons.punch.lastShot = -1e9;
    }
    if (weapons.acc) {
      weapons.acc.val = 0;
    }
    if (weapons.clearViewPunch) {
      weapons.clearViewPunch();
    }
  }

  function hookHud(hud) {
    if (!hud || hud._cheatHooked) return;
    hud._cheatHooked = true;

    if (hud.updateCrosshair) {
      const origUpdateCrosshair = hud.updateCrosshair.bind(hud);
      hud.updateCrosshair = function() {
        origUpdateCrosshair();
        if (window.cheats.rapidFire || window.cheats.noRecoil) {
          if (this.chEl) {
            this.chEl.style.transform = 'translate(0px, 0px)';
          }
          if (this.hmWrap) {
            this.hmWrap.style.transform = 'translate(0px, 0px)';
          }
          this._chX = 0;
          this._chY = 0;
        }
      };
    }
  }

  function hookViewmodel(vm) {
    if (!vm || vm._cheatHooked) return;
    vm._cheatHooked = true;

    if (vm.kick) {
      const origKick = vm.kick.bind(vm);
      vm.kick = function(def) {
        if (window.cheats.rapidFire || window.cheats.noRecoil) return;
        return origKick(def);
      };
    }
  }

  function cheatTick() {
    const game = window.game;
    if (game) {
      if (game.player && !game.player._cheatHooked) {
        hookPlayer(game.player);
      }
      if (game.weapons && !game.weapons._cheatHooked) {
        hookWeapons(game.weapons);
      }
      if (game.hud && !game.hud._cheatHooked) {
        hookHud(game.hud);
      }
      if (game.viewmodel && !game.viewmodel._cheatHooked) {
        hookViewmodel(game.viewmodel);
      }

      const isStaticAim = window.cheats.rapidFire || window.cheats.noRecoil;

      if (document.body) {
        document.body.classList.toggle('static-crosshair', isStaticAim);
      }

      if (isStaticAim && game.hud) {
        if (game.hud.chEl) {
          game.hud.chEl.style.transform = 'translate(0px, 0px)';
        }
        if (game.hud.hmWrap) {
          game.hud.hmWrap.style.transform = 'translate(0px, 0px)';
        }
        game.hud._chX = 0;
        game.hud._chY = 0;
      }

      if (isStaticAim && game.effects && game.effects.clearShake) {
        game.effects.clearShake();
      }

      if (game.player && game.player.alive) {
        if (window.cheats.godmode) {
          game.player.health = 100;
          if (game.hud && game.hud.updateHealth) game.hud.updateHealth();
        }
        if (window.cheats.infiniteMoney) {
          game.player.money = 16000;
        }
      }

      if (game.weapons) {
        if (window.cheats.infiniteAmmo) {
          const st = game.weapons.state ? game.weapons.state() : null;
          if (st) {
            st.ammo = 999;
            st.reserve = 999;
          }
        }
        if (window.cheats.rapidFire) {
          game.weapons.nextFire = 0;
          game.weapons._pull = true;
        }
        if (isStaticAim) {
          cleanRecoil(game.weapons);
        }
      }

      if (game.botMgr && game.botMgr.bots) {
        for (const b of game.botMgr.bots) {
          if (!b.alive) continue;

          if (window.cheats.freezeBots) {
            b.vx = 0;
            b.vy = 0;
            b.vz = 0;
            b.target = null;
          }

          if (b.cs2Agent && b.cs2Agent.root) {
            if (window.cheats.chams || window.cheats.esp) {
              b.cs2Agent.root.visible = true;
            }
            if (window.cheats.chams && !b._chamsApplied) {
              b._chamsApplied = true;
              b.cs2Agent.root.traverse(child => {
                if (child.isMesh && child.material) {
                  child.renderOrder = 99999;
                  if (Array.isArray(child.material)) {
                    child.material.forEach(m => { m.depthTest = false; });
                  } else {
                    child.material.depthTest = false;
                  }
                }
              });
            } else if (!window.cheats.chams && b._chamsApplied) {
              b._chamsApplied = false;
              b.cs2Agent.root.traverse(child => {
                if (child.isMesh && child.material) {
                  child.renderOrder = 0;
                  if (Array.isArray(child.material)) {
                    child.material.forEach(m => { m.depthTest = true; });
                  } else {
                    child.material.depthTest = true;
                  }
                }
              });
            }
          }
        }
      }
    }

    renderEsp();

    requestAnimationFrame(cheatTick);
  }

  function renderEsp() {
    if (!espCanvas || !espCtx) return;
    espCtx.clearRect(0, 0, espCanvas.width, espCanvas.height);

    if (!window.cheats.esp || !window.game || !window.game.camera || !window.game.botMgr) {
      return;
    }

    const game = window.game;
    const cam = game.camera;
    const w = espCanvas.width;
    const h = espCanvas.height;
    const player = game.player;

    if (!cam.matrixWorld || !cam.matrixWorld.elements) return;
    const m = cam.matrixWorld.elements;
    const fx = -m[8];
    const fy = -m[9];
    const fz = -m[10];

    for (const b of game.botMgr.bots) {
      if (!b.alive) continue;

      const dx = b.x - cam.position.x;
      const dy = b.y - cam.position.y;
      const dz = b.z - cam.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const dot = dx * fx + dy * fy + dz * fz;
      if (dot <= 0.2) continue;

      const feetPos = project3D(b.x, b.y, b.z, cam, w, h);
      const headPos = project3D(b.x, b.y + 1.82, b.z, cam, w, h);

      if (!feetPos || !headPos) continue;

      const boxH = Math.abs(feetPos.y - headPos.y);
      if (boxH < 4 || boxH > h * 1.5) continue;

      const boxW = Math.max(10, boxH * 0.48);
      const boxX = feetPos.x - boxW * 0.5;
      const boxY = headPos.y;

      const isEnemy = b.team !== (player ? player.team : 'CT');
      const boxColor = isEnemy ? '#ff3232' : '#32fa32';

      espCtx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
      espCtx.lineWidth = 3;
      espCtx.strokeRect(boxX, boxY, boxW, boxH);

      espCtx.strokeStyle = boxColor;
      espCtx.lineWidth = 1.5;
      espCtx.strokeRect(boxX, boxY, boxW, boxH);

      const hp = Math.max(0, Math.min(100, b.health || 100));
      const barH = (boxH * hp) / 100;
      const barX = boxX - 6;

      espCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      espCtx.fillRect(barX, boxY, 3, boxH);
      espCtx.fillStyle = hp > 50 ? '#32fa32' : hp > 25 ? '#fafa32' : '#fa3232';
      espCtx.fillRect(barX, boxY + (boxH - barH), 3, barH);

      espCtx.fillStyle = '#ffffff';
      espCtx.font = 'bold 11px monospace';
      espCtx.shadowColor = '#000000';
      espCtx.shadowBlur = 3;
      espCtx.fillText(`${b.name || 'Bot'} [${Math.round(dist)}m]`, boxX, boxY - 5);
      espCtx.shadowBlur = 0;
    }
  }

  function project3D(x, y, z, cam, screenW, screenH) {
    if (!cam || !cam.position) return null;
    const Vector3 = cam.position.constructor;
    const v = new Vector3(x, y, z);
    v.project(cam);
    if (v.z < -1 || v.z > 1) return null;
    return {
      x: (v.x * 0.5 + 0.5) * screenW,
      y: (-v.y * 0.5 + 0.5) * screenH
    };
  }

  function giveWeapon(name) {
    if (window.game && window.game.weapons && window.game.weapons.give) {
      window.game.weapons.give(name);
      showNotice(`Equipped: ${name.toUpperCase()}`);
    }
  }

  function killAllBots() {
    if (window.game && window.game.botMgr && window.game.botMgr.bots) {
      let count = 0;
      const def = window.game.weapons ? window.game.weapons.def() : null;
      for (const b of window.game.botMgr.bots) {
        if (b.alive) {
          if (window.game.dealDamage) {
            window.game.dealDamage(b, 9999, 'head', false, def);
          } else {
            b.health = 0;
            b.alive = false;
          }
          count++;
        }
      }
      showNotice(`Eliminated ${count} Bots!`);
    }
  }

  function revivePlayer() {
    if (window.game) {
      const g = window.game;
      if (g.respawnPlayer) {
        g.respawnPlayer();
      }
      if (g.player) {
        g.player.alive = true;
        g.player.health = 100;
        g.player.armor = 100;
        g.player.helmet = true;
      }
      if (g.hud) {
        if (g.hud.hideDeath) g.hud.hideDeath();
        if (g.hud.updateHealth) g.hud.updateHealth();
        if (g.hud.updateArmor) g.hud.updateArmor();
      }
      if (g._clearDeathCam) g._clearDeathCam();
      showNotice('Player Revived!');
    }
  }

  function addMoney(amt = 16000) {
    if (window.game && window.game.player) {
      window.game.player.money = Math.min(16000, (window.game.player.money || 0) + amt);
      showNotice(`+$${amt} Added!`);
    }
  }

  function showNotice(text) {
    const badge = document.getElementById('cheat-quick-notice');
    if (badge) {
      badge.textContent = text;
      badge.style.opacity = '1';
      clearTimeout(badge._timer);
      badge._timer = setTimeout(() => { badge.style.opacity = '0'; }, 2000);
    }
  }

  function toggleCheatMenu() {
    if (menuOpen) {
      closeCheatMenu();
    } else {
      openCheatMenu();
    }
  }

  function openCheatMenu() {
    const overlay = document.getElementById('cheat-menu-overlay');
    if (overlay) {
      overlay.classList.add('active');
      menuOpen = true;
      if (window.game && window.game.input && window.game.input.keys) {
        window.game.input.keys.clear();
      }
      if (document.exitPointerLock) {
        document.exitPointerLock();
      }
    }
  }

  function closeCheatMenu() {
    const overlay = document.getElementById('cheat-menu-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      menuOpen = false;
      if (window.game && window.game.renderer && window.game.renderer.domElement) {
        window.game.renderer.domElement.requestPointerLock();
      }
    }
  }

  window.addEventListener('keydown', function(e) {
    if (e.code === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      toggleCheatMenu();
    } else if (e.code === 'Escape' && menuOpen) {
      e.preventDefault();
      e.stopPropagation();
      closeCheatMenu();
    }
  }, true);

  window.addEventListener('keyup', function(e) {
    if (e.code === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  function buildCheatUI() {
    espCanvas = document.createElement('canvas');
    espCanvas.id = 'cheat-esp-canvas';
    espCanvas.width = window.innerWidth;
    espCanvas.height = window.innerHeight;
    espCtx = espCanvas.getContext('2d');
    document.body.appendChild(espCanvas);

    window.addEventListener('resize', () => {
      if (espCanvas) {
        espCanvas.width = window.innerWidth;
        espCanvas.height = window.innerHeight;
      }
    });

    const watermark = document.createElement('div');
    watermark.id = 'cheat-watermark';
    watermark.innerHTML = `[TAB] CHEATS`;
    watermark.title = 'Click or Press TAB to toggle Cheat Menu';
    watermark.onclick = toggleCheatMenu;
    document.body.appendChild(watermark);

    const overlay = document.createElement('div');
    overlay.id = 'cheat-menu-overlay';
    overlay.innerHTML = `
      <div id="cheat-menu-container">
        <!-- Header -->
        <div class="cheat-header">
          <div class="cheat-title-area">
            <div class="cheat-logo">TACTICAL<span>.GG</span></div>
            <div class="cheat-badge">MOD MENU</div>
            <div id="cheat-quick-notice" style="font-size:11px; color:#3cff5a; opacity:0; transition:opacity 0.2s;"></div>
          </div>
          <button class="cheat-close-btn" id="cheat-btn-close">✕</button>
        </div>

        <!-- Body -->
        <div class="cheat-body">
          <!-- Sidebar Tabs -->
          <div class="cheat-sidebar">
            <button class="cheat-tab-btn active" data-tab="player">🛡️ Player</button>
            <button class="cheat-tab-btn" data-tab="weapons">🔫 Weapons</button>
            <button class="cheat-tab-btn" data-tab="visuals">👁️ Visuals</button>
            <button class="cheat-tab-btn" data-tab="spawner">📦 Spawner</button>
            <button class="cheat-tab-btn" data-tab="match">⚙️ Match & Bots</button>
          </div>

          <!-- Content Panes -->
          <div class="cheat-content" id="cheat-content-area">
            <!-- Content injected dynamically -->
          </div>
        </div>

        <!-- Footer -->
        <div class="cheat-footer">
          <div>Press <kbd>TAB</kbd> or <kbd>ESC</kbd> to toggle menu</div>
          <div>Status: <span style="color:#3cff5a;">Connected</span></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('cheat-btn-close').onclick = closeCheatMenu;

    overlay.onclick = (e) => {
      if (e.target === overlay) closeCheatMenu();
    };

    const tabBtns = overlay.querySelectorAll('.cheat-tab-btn');
    tabBtns.forEach(btn => {
      btn.onclick = () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTab(btn.dataset.tab);
      };
    });

    renderTab('player');
  }

  function renderTab(tab) {
    const area = document.getElementById('cheat-content-area');
    if (!area) return;

    if (tab === 'player') {
      area.innerHTML = `
        <div class="cheat-card">
          <div class="cheat-card-title">Survivability & Cash</div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">God Mode</div>
              <div class="cheat-desc">Invulnerability from all damage, bullets, and falls</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-godmode" ${window.cheats.godmode ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Infinite Money</div>
              <div class="cheat-desc">Locks cash at $16,000 max balance</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-money" ${window.cheats.infiniteMoney ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
        </div>

        <div class="cheat-card">
          <div class="cheat-card-title">Movement & Physics</div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Speed Hack</div>
              <div class="cheat-desc">Multiply player movement speed</div>
            </div>
            <div class="cheat-range-container">
              <input type="range" class="cheat-range" id="rng-speed" min="1" max="3" step="0.25" value="${window.cheats.speedMult}">
              <span class="cheat-val-badge" id="val-speed">${window.cheats.speedMult}x</span>
            </div>
          </div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Super Jump</div>
              <div class="cheat-desc">High vertical jump impulse</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-jump" ${window.cheats.superJump ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Flight (No Noclip)</div>
              <div class="cheat-desc">Fly smoothly ([SPACE] up, [SHIFT] down) respecting walls</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-flight" ${window.cheats.flight ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Noclip (Ghost Mode)</div>
              <div class="cheat-desc">Fly and pass completely through all walls and obstacles</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-noclip" ${window.cheats.noclip ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
        </div>
      `;

      bindCheckbox('chk-godmode', v => { window.cheats.godmode = v; });
      bindCheckbox('chk-money', v => { window.cheats.infiniteMoney = v; });
      bindCheckbox('chk-jump', v => { window.cheats.superJump = v; });
      bindCheckbox('chk-flight', v => { window.cheats.flight = v; });
      bindCheckbox('chk-noclip', v => { window.cheats.noclip = v; });

      const rngSpeed = document.getElementById('rng-speed');
      const valSpeed = document.getElementById('val-speed');
      if (rngSpeed) {
        rngSpeed.oninput = () => {
          const v = parseFloat(rngSpeed.value);
          window.cheats.speedMult = v;
          valSpeed.textContent = v.toFixed(2) + 'x';
        };
      }
    } else if (tab === 'weapons') {
      area.innerHTML = `
        <div class="cheat-card">
          <div class="cheat-card-title">Shooting & Recoil</div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Infinite Ammo</div>
              <div class="cheat-desc">Never reload; infinite bullets in clip and reserve</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-ammo" ${window.cheats.infiniteAmmo ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">No Recoil & No Spread</div>
              <div class="cheat-desc">100% pinpoint laser accuracy with zero weapon kick</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-recoil" ${window.cheats.noRecoil ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Rapid Fire</div>
              <div class="cheat-desc">Extreme firing rate & full auto for all weapons</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-rapid" ${window.cheats.rapidFire ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">One-Hit Kill</div>
              <div class="cheat-desc">All bullet impacts deal 9999 lethal damage</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-onehit" ${window.cheats.oneHitKill ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
        </div>
      `;

      bindCheckbox('chk-ammo', v => { window.cheats.infiniteAmmo = v; });
      bindCheckbox('chk-recoil', v => { window.cheats.noRecoil = v; });
      bindCheckbox('chk-rapid', v => { window.cheats.rapidFire = v; });
      bindCheckbox('chk-onehit', v => { window.cheats.oneHitKill = v; });
    } else if (tab === 'visuals') {
      area.innerHTML = `
        <div class="cheat-card">
          <div class="cheat-card-title">Wallhack & ESP Overlays</div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Chams / Wallhack</div>
              <div class="cheat-desc">Renders all 3D enemy bot models through walls</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-chams" ${window.cheats.chams ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">2D Box ESP</div>
              <div class="cheat-desc">Draws bounding boxes, health bars, and distance on screen</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-esp" ${window.cheats.esp ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
        </div>
      `;

      bindCheckbox('chk-chams', v => { window.cheats.chams = v; });
      bindCheckbox('chk-esp', v => { window.cheats.esp = v; });
    } else if (tab === 'spawner') {
      area.innerHTML = `
        <div class="cheat-card">
          <div class="cheat-card-title">Rifles</div>
          <div class="cheat-weapon-grid">
            <button class="cheat-weapon-btn" data-gun="ak47">AK-47</button>
            <button class="cheat-weapon-btn" data-gun="m4a1s">M4A1-S</button>
            <button class="cheat-weapon-btn" data-gun="m4a4">M4A4</button>
            <button class="cheat-weapon-btn" data-gun="aug">AUG</button>
            <button class="cheat-weapon-btn" data-gun="sg553">SG 553</button>
            <button class="cheat-weapon-btn" data-gun="famas">FAMAS</button>
            <button class="cheat-weapon-btn" data-gun="galil">Galil AR</button>
          </div>
        </div>

        <div class="cheat-card">
          <div class="cheat-card-title">Snipers</div>
          <div class="cheat-weapon-grid">
            <button class="cheat-weapon-btn" data-gun="awp">AWP</button>
            <button class="cheat-weapon-btn" data-gun="ssg08">SSG 08 (Scout)</button>
            <button class="cheat-weapon-btn" data-gun="scar20">SCAR-20</button>
            <button class="cheat-weapon-btn" data-gun="g3sg1">G3SG1</button>
          </div>
        </div>

        <div class="cheat-card">
          <div class="cheat-card-title">Pistols</div>
          <div class="cheat-weapon-grid">
            <button class="cheat-weapon-btn" data-gun="deagle">Desert Eagle</button>
            <button class="cheat-weapon-btn" data-gun="usps">USP-S</button>
            <button class="cheat-weapon-btn" data-gun="glock">Glock-18</button>
            <button class="cheat-weapon-btn" data-gun="p250">P250</button>
            <button class="cheat-weapon-btn" data-gun="fiveseven">Five-SeveN</button>
            <button class="cheat-weapon-btn" data-gun="tec9">Tec-9</button>
            <button class="cheat-weapon-btn" data-gun="cz75">CZ75-Auto</button>
            <button class="cheat-weapon-btn" data-gun="r8">R8 Revolver</button>
            <button class="cheat-weapon-btn" data-gun="dualies">Dual Berettas</button>
          </div>
        </div>

        <div class="cheat-card">
          <div class="cheat-card-title">SMGs & Heavies</div>
          <div class="cheat-weapon-grid">
            <button class="cheat-weapon-btn" data-gun="p90">P90</button>
            <button class="cheat-weapon-btn" data-gun="mp9">MP9</button>
            <button class="cheat-weapon-btn" data-gun="mac10">MAC-10</button>
            <button class="cheat-weapon-btn" data-gun="mp7">MP7</button>
            <button class="cheat-weapon-btn" data-gun="mp5sd">MP5-SD</button>
            <button class="cheat-weapon-btn" data-gun="ump45">UMP-45</button>
            <button class="cheat-weapon-btn" data-gun="bizon">PP-Bizon</button>
            <button class="cheat-weapon-btn" data-gun="negev">Negev</button>
            <button class="cheat-weapon-btn" data-gun="m249">M249</button>
            <button class="cheat-weapon-btn" data-gun="xm1014">XM1014</button>
            <button class="cheat-weapon-btn" data-gun="mag7">MAG-7</button>
          </div>
        </div>

        <div class="cheat-card">
          <div class="cheat-card-title">Equipment & Grenades</div>
          <div class="cheat-weapon-grid">
            <button class="cheat-weapon-btn" data-gun="zeus">Zeus x27</button>
            <button class="cheat-weapon-btn" data-gun="he">HE Grenade</button>
            <button class="cheat-weapon-btn" data-gun="flash">Flashbang</button>
            <button class="cheat-weapon-btn" data-gun="smoke">Smoke Grenade</button>
            <button class="cheat-weapon-btn" data-gun="molotov">Molotov</button>
          </div>
        </div>
      `;

      area.querySelectorAll('.cheat-weapon-btn').forEach(btn => {
        btn.onclick = () => { giveWeapon(btn.dataset.gun); };
      });
    } else if (tab === 'match') {
      area.innerHTML = `
        <div class="cheat-card">
          <div class="cheat-card-title">Bot Management</div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Freeze Bots</div>
              <div class="cheat-desc">Disable all bot movement, aiming, and shooting</div>
            </div>
            <label class="cheat-switch">
              <input type="checkbox" id="chk-freeze" ${window.cheats.freezeBots ? 'checked' : ''}>
              <span class="cheat-slider"></span>
            </label>
          </div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Instant Kill All Bots</div>
              <div class="cheat-desc">Eliminate every bot on the map immediately</div>
            </div>
            <button class="cheat-btn danger" id="btn-kill-bots">Kill All Bots</button>
          </div>
        </div>

        <div class="cheat-card">
          <div class="cheat-card-title">Player Quick Actions</div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Revive / Full Health</div>
              <div class="cheat-desc">Restore 100 HP, 100 Armor, and resurrect player</div>
            </div>
            <button class="cheat-btn" id="btn-revive">Revive</button>
          </div>
          <div class="cheat-row">
            <div>
              <div class="cheat-label">Give $16,000 Cash</div>
              <div class="cheat-desc">Instantly fill bank to max balance</div>
            </div>
            <button class="cheat-btn" id="btn-money-add">Add $16,000</button>
          </div>
        </div>
      `;

      bindCheckbox('chk-freeze', v => { window.cheats.freezeBots = v; });

      const btnKill = document.getElementById('btn-kill-bots');
      if (btnKill) btnKill.onclick = killAllBots;

      const btnRevive = document.getElementById('btn-revive');
      if (btnRevive) btnRevive.onclick = revivePlayer;

      const btnMoney = document.getElementById('btn-money-add');
      if (btnMoney) btnMoney.onclick = () => addMoney(16000);
    }
  }

  function bindCheckbox(id, onChange) {
    const el = document.getElementById(id);
    if (el) {
      el.onchange = () => { onChange(el.checked); };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      buildCheatUI();
      hookGameEngine();
    });
  } else {
    buildCheatUI();
    hookGameEngine();
  }
})();
