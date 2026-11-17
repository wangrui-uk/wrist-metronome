// Respect Reduce Motion: don't autoplay the promo video; show controls instead.
(function () {
  var mq = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  function apply() {
    var videos = document.querySelectorAll("video[data-promo]");
    for (var i = 0; i < videos.length; i++) {
      var v = videos[i];
      if (mq && mq.matches) {
        v.removeAttribute("autoplay");
        v.autoplay = false;
        v.pause();
        v.controls = true;
      }
    }
  }
  apply();
  if (mq && mq.addEventListener) mq.addEventListener("change", apply);
})();

// Screenshot gallery: Cover Flow. Without JS it stays a horizontal scroll list.
(function () {
  var wrap = document.querySelector(".gallery-wrap");
  var g = document.getElementById("gallery");
  if (!wrap || !g || !window.matchMedia || !("classList" in g)) return;
  var items = Array.prototype.slice.call(g.children);
  var n = items.length;
  if (n < 2) return;
  var prev = wrap.querySelector('.cf-btn[data-dir="-1"]');
  var next = wrap.querySelector('.cf-btn[data-dir="1"]');
  var meta = wrap.querySelector(".cf-meta");
  var caption = wrap.querySelector(".cf-caption");
  var count = wrap.querySelector(".cf-count");
  var live = wrap.querySelector(".cf-live");
  var dotsBox = wrap.querySelector(".cf-dots");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobile = window.matchMedia("(max-width: 700px)");
  var light = window.matchMedia("(prefers-color-scheme: light)");
  var cur = Math.min(3, n - 1); // start with a watch shot, three panes on each side
  var dots = [];

  wrap.classList.add("is-cf", "is-cf-init");
  g.setAttribute("aria-label", "Screenshots. Use the Left and Right arrow keys to browse.");
  g.setAttribute("role", "group");
  items.forEach(function (li, i) {
    var img = li.querySelector("img");
    img.draggable = false;
    if (Math.abs(i - cur) <= 4) img.loading = "eager";
    li.setAttribute("role", "group");
    li.setAttribute("aria-roledescription", "slide");
    li.setAttribute("aria-label", (i + 1) + " of " + n);
    li.addEventListener("click", function () {
      if (dragged) return;
      if (i !== cur) go(i);
    });
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "cf-dot";
    dot.setAttribute("aria-controls", "gallery");
    dot.setAttribute("aria-label", "Show screenshot " + (i + 1) + " of " + n + ": " + li.getAttribute("data-caption"));
    dot.addEventListener("click", function () { go(i); });
    dotsBox.appendChild(dot);
    dots.push(dot);
  });
  prev.hidden = next.hidden = meta.hidden = false;

  var H = 440, widths = [];
  // Size every pane by a common height, with a maximum width so wide shots don't dominate.
  function size() {
    var stageW = g.clientWidth, vh = window.innerHeight || 800, maxW;
    if (mobile.matches) {
      H = Math.round(Math.max(280, Math.min(420, vh * 0.56, stageW * 1.05)));
      maxW = stageW * 0.74;
    } else {
      H = Math.round(Math.max(320, Math.min(430, vh * 0.5)));
      maxW = H * 1.2;
    }
    wrap.style.setProperty("--cf-h", H + "px");
    widths = items.map(function (li) {
      var img = li.firstElementChild;
      var aw = +img.getAttribute("width"), ah = +img.getAttribute("height");
      // Watch shots are small, nearly square bitmaps: a little shorter so they don't loom.
      var hh = /\bwatch\b/.test(img.className) ? H * 0.82 : H;
      var h = Math.min(hh, maxW * ah / aw), w = Math.round(h * aw / ah);
      img.style.width = w + "px";
      img.style.height = Math.round(h) + "px";
      return w;
    });
  }

  function layout() {
    var P = 1600, rm = reduce.matches, mob = mobile.matches;
    var c = widths[cur] / 2;
    var side = [0, 0]; // running screen-x of the previous pane on each side
    for (var k = 1; k < n; k++) {
      [-1, 1].forEach(function (s) {
        var i = cur + s * k;
        if (i < 0 || i >= n) return;
        place(i, s, k);
      });
    }
    place(cur, 0, 0);

    function place(i, s, k) {
      var li = items[i], st = li.style, w = widths[i];
      var x = 0, z = 0, rot = 0, scale = 1, op = 1, filt = "none", off = false;
      if (rm) {
        // Crossfade only: every pane sits flat in the centre.
        op = k === 0 ? 1 : 0;
        off = k !== 0;
      } else if (mob) {
        if (k > 0) {
          scale = 0.8;
          op = k === 1 ? 0.5 : 0;
          off = k > 1;
          var kk = Math.min(k, 2);
          x = s * (c + 14 + (w * scale) / 2 + (kk - 1) * w * scale * 0.6);
          filt = light.matches ? "none" : "brightness(0.75)";
        }
      } else if (k > 0) {
        var a = 55 * Math.PI / 180;
        var kk2 = Math.min(k, 4);
        z = -(170 + (kk2 - 1) * 70);
        var f = P / (P - z);
        var proj = w * Math.cos(a) * f;          // projected width, roughly
        var sx;
        if (kk2 === 1) sx = c + 18 + proj / 2;
        else sx = side[s > 0 ? 1 : 0] + Math.max(H * 0.2, proj * 0.42);
        side[s > 0 ? 1 : 0] = sx;
        x = s * sx / f;
        rot = -s * 55;
        op = k <= 2 ? 1 : k === 3 ? 0.75 : 0;
        off = k > 3;
        var blur = [0, 0.6, 1.3, 2, 2.5][kk2];
        if (light.matches) {
          // On the light page, wash out towards the background instead of darkening
          // (opaque, so overlapping panes don't show through each other).
          var c2 = [1, 0.72, 0.6, 0.5, 0.5][kk2];
          filt = "contrast(" + c2 + ") brightness(" + (2 - c2) + ") saturate(0.8) blur(" + blur + "px)";
        } else {
          filt = "brightness(" + [1, 0.58, 0.42, 0.3, 0.25][kk2] + ") blur(" + blur + "px)";
        }
      }
      st.transform = "translateX(-50%) translateX(" + x.toFixed(1) + "px) translateZ(" + z + "px) rotateY(" + rot + "deg) scale(" + scale + ")";
      st.opacity = op;
      st.filter = filt;
      st.zIndex = n - k;
      li.classList.toggle("is-off", off);
      li.classList.toggle("is-active", k === 0);
      if (k === 0) li.removeAttribute("aria-hidden"); else li.setAttribute("aria-hidden", "true");
    }
  }

  function update(announce) {
    layout();
    var cap = items[cur].getAttribute("data-caption") || "";
    caption.textContent = cap;
    count.textContent = (cur + 1) + " / " + n;
    dots.forEach(function (d, i) {
      if (i === cur) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current");
    });
    var atStart = cur === 0, atEnd = cur === n - 1;
    // Keep keyboard focus on a usable control when an end is reached.
    if (atStart && document.activeElement === prev) next.focus();
    if (atEnd && document.activeElement === next) prev.focus();
    prev.disabled = atStart;
    next.disabled = atEnd;
    if (announce) live.textContent = "Slide " + (cur + 1) + " of " + n + ": " + cap;
  }

  var lastGo = 0;
  function go(i) {
    i = Math.max(0, Math.min(n - 1, i));
    if (i === cur) return false;
    cur = i;
    lastGo = Date.now();
    var img = items[Math.min(n - 1, cur + 4)].firstElementChild; img.loading = "eager";
    img = items[Math.max(0, cur - 4)].firstElementChild; img.loading = "eager";
    update(true);
    return true;
  }

  prev.addEventListener("click", function () { go(cur - 1); });
  next.addEventListener("click", function () { go(cur + 1); });

  wrap.addEventListener("keydown", function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    var k = e.key, t = null;
    if (k === "ArrowLeft") t = cur - 1;
    else if (k === "ArrowRight") t = cur + 1;
    else if (k === "Home" && e.target === g) t = 0;
    else if (k === "End" && e.target === g) t = n - 1;
    if (t === null) return;
    e.preventDefault();
    go(t);
  });

  // Touch and mouse drag: a horizontal swipe past a threshold moves one step.
  var startX = null, startY = 0, dragged = false;
  g.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    startX = e.clientX; startY = e.clientY; dragged = false;
  });
  g.addEventListener("pointermove", function (e) {
    if (startX !== null && Math.abs(e.clientX - startX) > 8) dragged = true;
  });
  function endDrag(e) {
    if (startX === null) return;
    var dx = e.clientX - startX, dy = e.clientY - startY;
    startX = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
    // Let the click that follows a drag be ignored, then reset.
    setTimeout(function () { dragged = false; }, 0);
  }
  g.addEventListener("pointerup", endDrag);
  g.addEventListener("pointercancel", function () { startX = null; dragged = false; });

  // Wheel: a vertical wheel notch or a horizontal trackpad swipe moves one step.
  // Deltas are accumulated; after a step, the rest of that gesture (trackpad momentum)
  // is swallowed until the events pause. At either end a fresh gesture is left alone,
  // so the page scrolls on. Shift+wheel and pinch-zoom (ctrlKey) are not touched.
  var acc = 0, locked = false, idle, lastDelta = 0;
  g.addEventListener("wheel", function (e) {
    if (e.ctrlKey || e.shiftKey) return;
    var unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? 800 : 1;
    var dx = e.deltaX * unit, dy = e.deltaY * unit;
    var d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    if (!d) return;
    var dir = d > 0 ? 1 : -1;
    clearTimeout(idle);
    idle = setTimeout(function () { locked = false; acc = 0; lastDelta = 0; }, 180);
    var mag = Math.abs(d);
    // A new wheel notch while still locked: allow it once the last move has settled.
    if (locked && mag >= 50 && Date.now() - lastGo > 380 && mag >= lastDelta) locked = false;
    lastDelta = mag;
    if (locked) { e.preventDefault(); return; }
    if ((dir < 0 && cur === 0) || (dir > 0 && cur === n - 1)) { acc = 0; return; }
    e.preventDefault();
    if (acc && (acc > 0) !== (dir > 0)) acc = 0;
    acc += d;
    if (Math.abs(acc) >= 40) {
      acc = 0;
      locked = true;
      go(cur + dir);
    }
  }, { passive: false });

  function relayout() { size(); layout(); }
  window.addEventListener("resize", relayout);
  if (reduce.addEventListener) reduce.addEventListener("change", layout);
  if (light.addEventListener) light.addEventListener("change", layout);
  if (mobile.addEventListener) mobile.addEventListener("change", relayout);

  // First layout without animating in.
  items.forEach(function (li) { li.style.transition = "none"; });
  size();
  update(false);
  void g.offsetWidth;
  items.forEach(function (li) { li.style.transition = ""; });
  requestAnimationFrame(function () { wrap.classList.remove("is-cf-init"); });
})();
