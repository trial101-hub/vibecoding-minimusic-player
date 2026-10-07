(function () {
  var audio = document.getElementById('audio');
  var playBtn = document.getElementById('play');
  var iconPlay = document.getElementById('icon-play');
  var iconPause = document.getElementById('icon-pause');
  var bar = document.getElementById('bar');
  var fill = document.getElementById('fill');
  var thumb = document.getElementById('thumb');
  var timeCurrent = document.getElementById('time-current');
  var timeTotal = document.getElementById('time-total');
  var volume = document.getElementById('volume');
  var muteBtn = document.getElementById('mute');
  var iconSound = document.getElementById('icon-sound');
  var iconMuted = document.getElementById('icon-muted');
  var restartBtn = document.getElementById('restart');

  var rafId = null;
  var dragging = false;

  function format(seconds) {
    if (!isFinite(seconds) || seconds < 0) seconds = 0;
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' + s : s);
  }

  function paint(ratio, seconds) {
    var pct = Math.max(0, Math.min(1, ratio)) * 100;
    bar.style.setProperty('--p', pct);
    fill.style.width = pct + '%';
    thumb.style.left = pct + '%';
    timeCurrent.textContent = format(seconds);
    bar.setAttribute('aria-valuenow', Math.round(seconds));
    bar.setAttribute('aria-valuetext', format(seconds) + ' of ' + format(audio.duration));
  }

  function render() {
    var dur = audio.duration || 0;
    paint(dur ? audio.currentTime / dur : 0, audio.currentTime);
  }

  function tick() {
    render();
    if (!audio.paused && !dragging) rafId = requestAnimationFrame(tick);
  }

  function setPlayingUI(isPlaying) {
    iconPlay.classList.toggle('on', !isPlaying);
    iconPause.classList.toggle('on', isPlaying);
    playBtn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    if (isPlaying) {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }
  }

  function toggle() {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  audio.addEventListener('loadedmetadata', function () {
    timeTotal.textContent = format(audio.duration);
    bar.setAttribute('aria-valuemax', Math.round(audio.duration || 0));
    render();
  });
  audio.addEventListener('durationchange', function () {
    timeTotal.textContent = format(audio.duration);
    bar.setAttribute('aria-valuemax', Math.round(audio.duration || 0));
  });
  audio.addEventListener('play', function () { setPlayingUI(true); });
  audio.addEventListener('pause', function () { setPlayingUI(false); });
  audio.addEventListener('timeupdate', function () { if (!dragging) render(); });
  audio.addEventListener('ended', function () {
    audio.currentTime = 0;
    setPlayingUI(false);
    render();
  });

  playBtn.addEventListener('click', toggle);
  restartBtn.addEventListener('click', function () {
    audio.currentTime = 0;
    render();
  });

  /* --- seeking: click, drag, and keyboard --- */
  function ratioFromEvent(event) {
    var rect = bar.getBoundingClientRect();
    var x = event.clientX - rect.left;
    return rect.width ? x / rect.width : 0;
  }

  function seekTo(ratio) {
    var dur = audio.duration || 0;
    if (!dur) return;
    audio.currentTime = Math.max(0, Math.min(1, ratio)) * dur;
    render();
  }

  bar.addEventListener('pointerdown', function (event) {
    dragging = true;
    bar.classList.add('dragging');
    bar.setPointerCapture(event.pointerId);
    seekTo(ratioFromEvent(event));
  });
  bar.addEventListener('pointermove', function (event) {
    if (dragging) seekTo(ratioFromEvent(event));
  });
  bar.addEventListener('pointerup', function (event) {
    dragging = false;
    bar.classList.remove('dragging');
    bar.releasePointerCapture(event.pointerId);
  });
  bar.addEventListener('keydown', function (event) {
    var dur = audio.duration || 0;
    if (!dur) return;
    if (event.key === 'ArrowRight') { audio.currentTime = Math.min(dur, audio.currentTime + 5); render(); event.preventDefault(); }
    if (event.key === 'ArrowLeft') { audio.currentTime = Math.max(0, audio.currentTime - 5); render(); event.preventDefault(); }
    if (event.key === 'Home') { audio.currentTime = 0; render(); event.preventDefault(); }
    if (event.key === 'End') { audio.currentTime = dur; render(); event.preventDefault(); }
  });

  /* --- volume + mute --- */
  function syncMuteIcon() {
    var silent = audio.muted || audio.volume === 0;
    iconSound.classList.toggle('on', !silent);
    iconMuted.classList.toggle('on', silent);
    muteBtn.setAttribute('aria-label', silent ? 'Unmute' : 'Mute');
  }

  volume.addEventListener('input', function () {
    audio.volume = parseFloat(volume.value);
    audio.muted = false;
    syncMuteIcon();
  });
  muteBtn.addEventListener('click', function () {
    audio.muted = !audio.muted;
    syncMuteIcon();
  });

  audio.volume = parseFloat(volume.value);
  syncMuteIcon();
  render();

  /* --- space bar toggles play/pause --- */
  document.addEventListener('keydown', function (event) {
    if (event.code !== 'Space') return;
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'BUTTON' || tag === 'INPUT') return;
    event.preventDefault();
    toggle();
  });
})();
