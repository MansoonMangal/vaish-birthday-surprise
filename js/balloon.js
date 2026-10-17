(function(){
  var arena = document.getElementById('balloonArena');
  if (!arena) return;

  var counterEl   = document.getElementById('balloonCounter');
  var revealEl    = document.getElementById('birthdayReveal');
  var uiEl        = document.getElementById('balloonUI');
  var partyCanvas = document.getElementById('party-canvas');
  var replayBtn   = document.getElementById('replayBtn');

  var TOTAL  = 10;
  var TARGET = 6;
  var popped  = 0;
  var spawned = 0;
  var escaped = 0;
  var gameOver = false;

  var colors = [
    '#ff6b8a','#ff9fc7','#a8d8ff','#c7a9ff','#ffcc70',
    '#7dd87d','#ff8c42','#69d2e7','#f38181','#aa96da'
  ];

  function createBalloon(){
    var balloon = document.createElement('div');
    balloon.className = 'game-balloon';
    var color = colors[spawned % colors.length];
    balloon.style.setProperty('--balloon-color', color);
    balloon.style.left = (8 + Math.random() * 78) + '%';
    balloon.style.setProperty('--duration', '1s');
    balloon.style.setProperty('--wobble', (6 + Math.random() * 14) + 'px');

    balloon.addEventListener('click', function(e){
      e.stopPropagation();
      popBalloon(balloon);
    });

    balloon.addEventListener('animationend', function(){
      if (!balloon.classList.contains('popped')){
        balloon.remove();
        escaped++;
        checkMissed();
      }
    });

    arena.appendChild(balloon);
    spawned++;
  }

  function spawnWave(){
    if (gameOver) return;

    var batchSize = (spawned === 0) ? 6 : 4;

    for (var i = 0; i < batchSize && spawned < TOTAL; i++){
      (function(delay){
        setTimeout(function(){
          if (!gameOver) createBalloon();
        }, delay);
      })(i * 120);
    }

    if (spawned + batchSize < TOTAL && !gameOver){
      setTimeout(spawnWave, 1800);
    }
  }

  function popBalloon(balloon){
    if (balloon.classList.contains('popped') || gameOver) return;

    var rect = balloon.getBoundingClientRect();
    var arenaRect = arena.getBoundingClientRect();
    balloon.style.bottom = 'auto';
    balloon.style.top  = (rect.top - arenaRect.top) + 'px';
    balloon.style.left = (rect.left - arenaRect.left) + 'px';

    balloon.classList.add('popped');
    popped++;
    counterEl.textContent = popped + ' / ' + TOTAL;

    var cx = rect.left - arenaRect.left + rect.width / 2;
    var cy = rect.top - arenaRect.top + rect.height / 2;
    var bColor = getComputedStyle(balloon).getPropertyValue('--balloon-color').trim();

    for (var i = 0; i < 8; i++){
      var p = document.createElement('div');
      p.className = 'pop-particle';
      p.style.left = cx + 'px';
      p.style.top  = cy + 'px';
      p.style.background = bColor;
      var angle = (i / 8) * Math.PI * 2;
      var dist  = 25 + Math.random() * 20;
      p.style.setProperty('--px', (Math.cos(angle) * dist) + 'px');
      p.style.setProperty('--py', (Math.sin(angle) * dist) + 'px');
      arena.appendChild(p);
      (function(el){ setTimeout(function(){ el.remove(); }, 500); })(p);
    }

    setTimeout(function(){ balloon.remove(); }, 350);

    if (popped >= TARGET){
      gameOver = true;
      triggerReveal();
    }
  }

  function checkMissed(){
    if (gameOver) return;
    if (popped + escaped >= TOTAL && popped < TARGET){
      var retry = document.createElement('button');
      retry.className = 'nav-btn';
      retry.textContent = 'try again 🎈';
      retry.style.marginTop = '16px';
      retry.addEventListener('click', function(){
        retry.remove();
        resetGame();
      });
      uiEl.appendChild(retry);
    }
  }

  function triggerReveal(){
    var remaining = arena.querySelectorAll('.game-balloon:not(.popped)');
    remaining.forEach(function(b, i){
      setTimeout(function(){
        var rect = b.getBoundingClientRect();
        var arenaRect = arena.getBoundingClientRect();
        b.style.bottom = 'auto';
        b.style.top  = (rect.top - arenaRect.top) + 'px';
        b.style.left = (rect.left - arenaRect.left) + 'px';
        b.classList.add('popped');
        setTimeout(function(){ b.remove(); }, 350);
      }, i * 120);
    });

    setTimeout(function(){
      uiEl.style.display = 'none';
      document.querySelector('.balloon-back').style.display = 'none';
      revealEl.classList.add('show');
      firePartyCannon();
    }, 800);
  }

  function firePartyCannon(){
    if (!partyCanvas) return;
    var ctx = partyCanvas.getContext('2d');
    partyCanvas.width  = window.innerWidth;
    partyCanvas.height = window.innerHeight;

    var confettiColors = [
      '#ffd6e8','#ff9fc7','#d6ecff','#a8d8ff',
      '#e6d9ff','#c7a9ff','#ffcc70','#ff6b8a','#fff'
    ];
    var pieces = [];

    for (var i = 0; i < 80; i++){
      pieces.push({
        x: -10,
        y: partyCanvas.height * (0.2 + Math.random() * 0.5),
        vx:  4 + Math.random() * 8,
        vy: -(2 + Math.random() * 7),
        g: 0.12 + Math.random() * 0.06,
        size: 4 + Math.random() * 6,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rot: Math.random() * 360,
        rs: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.5 ? 'c' : 'r'
      });
    }
    for (var i = 0; i < 80; i++){
      pieces.push({
        x: partyCanvas.width + 10,
        y: partyCanvas.height * (0.2 + Math.random() * 0.5),
        vx: -(4 + Math.random() * 8),
        vy: -(2 + Math.random() * 7),
        g: 0.12 + Math.random() * 0.06,
        size: 4 + Math.random() * 6,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rot: Math.random() * 360,
        rs: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.5 ? 'c' : 'r'
      });
    }

    var frames = 0;
    var maxFrames = 300;

    function animate(){
      ctx.clearRect(0, 0, partyCanvas.width, partyCanvas.height);
      for (var j = 0; j < pieces.length; j++){
        var p = pieces[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.g;
        p.vx *= 0.99;
        p.rot += p.rs;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        if (p.shape === 'c'){
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
        }
        ctx.restore();
      }
      frames++;
      if (frames < maxFrames) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, partyCanvas.width, partyCanvas.height);
    }

    animate();
  }

  function resetGame(){
    popped  = 0;
    spawned = 0;
    escaped = 0;
    gameOver = false;
    counterEl.textContent = '0 / ' + TOTAL;
    arena.innerHTML = '';
    uiEl.style.display = '';
    document.querySelector('.balloon-back').style.display = '';
    revealEl.classList.remove('show');
    if (partyCanvas){
      var ctx = partyCanvas.getContext('2d');
      ctx.clearRect(0, 0, partyCanvas.width, partyCanvas.height);
    }
    setTimeout(spawnWave, 500);
  }

  if (replayBtn){
    replayBtn.addEventListener('click', function(){ resetGame(); });
  }

  setTimeout(spawnWave, 1200);
})();
