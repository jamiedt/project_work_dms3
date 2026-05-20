// find our elements
let stageContainer = document.getElementById("stage-container");
const redCircleButton = document.getElementById("red-circle-button");
const greenCircleButton = document.getElementById("green-circle-button");
const blueCircleButton = document.getElementById("blue-circle-button");
const artworkTab = document.getElementById("artwork-tab");
const resetBtn = document.getElementById("reset");
const canvasOverlay = document.getElementById("canvas-overlay");
const saveArtworkBtn = document.getElementById("save-artwork-btn");
const canvasWrapper = document.getElementById("canvas-wrapper");

let dateColor = document.getElementById("date-color");
const root = document.documentElement;
const styles = getComputedStyle(root);
const c3 = styles.getPropertyValue("--c3").trim();

// track canvas open state
let canvasOpen = false;

// find stage container size
let stageContainerWidth = stageContainer.offsetWidth;
let stageContainerHeight = stageContainer.offsetHeight;

onresize = () => {
  stageContainerWidth = stageContainer.offsetWidth;
  stageContainerHeight = stageContainer.offsetHeight;
  stage.width(stageContainerWidth);
  stage.height(stageContainerHeight);
  bg.width(canvasWrapper.offsetWidth);
  bg.height(canvasWrapper.offsetHeight);
  canvasStage.width(canvasWrapper.offsetWidth);
  canvasStage.height(canvasWrapper.offsetHeight);
};

// create a stage the size of the container
const stage = new Konva.Stage({
  container: "konva-stage",
  width: stageContainerWidth,
  height: stageContainerHeight,
});

// Canvas stage sized to wrapper (slightly smaller than full screen)
const canvasStage = new Konva.Stage({
  container: "canvas-stage",
  width: canvasWrapper.offsetWidth,
  height: canvasWrapper.offsetHeight,
});

// add layers
const circleLayer = new Konva.Layer();
const resetLayer = new Konva.Layer();
const canvasLayer = new Konva.Layer();

// white background for artwork canvas
const bg = new Konva.Rect({
  x: 0,
  y: 0,
  width: canvasWrapper.offsetWidth,
  height: canvasWrapper.offsetHeight,
  fill: "white",
  listening: false,
});
canvasLayer.add(bg);

stage.add(circleLayer);
stage.add(resetLayer);
canvasStage.add(canvasLayer);

// keep track of all the merges order for the artwork
let mergeHistory = [];

// add circle interaction
function drawNewCircle(color) {
  const base = new Konva.Circle({
    x: stage.width() * Math.random(),
    y: stage.height() * Math.random(),
    draggable: true,
    radius: 50 * Math.random() + 20,
    fill: color,
    shadowColor: color,
    name: "shape",
  });

  base.on("mouseenter", function () {
    base.to({ shadowBlur: 25, shadowOpacity: 1, duration: 0.2 });
  });
  base.on("mouseleave", function () {
    base.to({ shadowBlur: 0, shadowOpacity: 0, duration: 0.2 });
  });

  base.on("mouseenter", () => (stage.container().style.cursor = "pointer"));
  base.on("mouseleave", () => (stage.container().style.cursor = "default"));
  base.on("mousedown", () => (stage.container().style.cursor = "grab"));
  base.on("mouseup", () => (stage.container().style.cursor = "pointer"));

  circleLayer.add(base);
}

circleLayer.on("mousedown", function (e) {
  const target = e.target;
  target.to({ scaleX: 1.1, scaleY: 1.1, duration: 0.2 });
});

circleLayer.on("mouseup", function (e) {
  const target = e.target;
  target.to({ scaleX: 1, scaleY: 1, duration: 0.2 });
});

circleLayer.on("dragmove", function (e) {
  const target = e.target;
  let activeIntersections = [];

  target.moveTo(resetLayer);
  target.moveTo(circleLayer);

  circleLayer.children.forEach(function (circle) {
    if (circle === target) return;

    circle.to({
      shadowBlur: 0,
      shadowOpacity: 0,
      shadowColor: circle.fill(),
      duration: 0.2,
    });

    if (haveIntersection(circle, target)) {
      circle.to({
        shadowBlur: 50,
        shadowOpacity: 1,
        shadowColor: c3,
        duration: 0.1,
      });
      target.to({
        shadowBlur: 50,
        shadowOpacity: 1,
        shadowColor: c3,
        duration: 0.1,
      });
      activeIntersections.push(circle);
    } else {
      let circleIndex = activeIntersections.indexOf(circle);
      if (circleIndex > -1) activeIntersections.splice(circleIndex, 1);
    }
  });

  if (activeIntersections.length < 1) {
    target.to({
      shadowBlur: 25,
      shadowOpacity: 1,
      shadowColor: target.fill(),
      duration: 0.1,
    });
  }
});

function haveIntersection(c1, c2) {
  const dx = c1.x() - c2.x();
  const dy = c1.y() - c2.y();
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < c1.radius() + c2.radius()) return true;
}

circleLayer.on("dragend", function (e) {
  const target = e.target;
  let toMerge = [target];

  circleLayer.children.forEach(function (circle) {
    if (circle === target) return;
    if (haveIntersection(circle, target)) {
      toMerge.push(circle);
      circle.draggable(false);
    }
  });

  if (toMerge.length > 1) {
    target.draggable(false);
    stage.container().style.cursor = "not-allowed";

    let totalRadius = 0;
    let avgX = 0;
    let avgY = 0;
    let H = 0,
      S = 0,
      L = 0;
    let avgH = 0,
      avgS = 0,
      avgL = 0;
    let sumX = 0,
      sumY = 0;
    let avgR = 0,
      avgG = 0,
      avgB = 0;

    toMerge.forEach((c) => {
      c.on(
        "mouseenter",
        () => (stage.container().style.cursor = "not-allowed"),
      );
      c.on("mouseleave", () => (stage.container().style.cursor = "default"));
      c.on("mouseup", () => (stage.container().style.cursor = "not-allowed"));
      c.on("mousedown", () => (stage.container().style.cursor = "not-allowed"));

      totalRadius += Math.PI * c.radius() ** 2;
      avgX += c.x();
      avgY += c.y();

      const rgb = Konva.Util.getRGB(c.fill());
      function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h,
          s,
          l = (max + min) / 2;
        if (max === min) {
          h = s = 0;
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r:
              h = (g - b) / d + (g < b ? 6 : 0);
              break;
            case g:
              h = (b - r) / d + 2;
              break;
            case b:
              h = (r - g) / d + 4;
              break;
          }
          h /= 6;
        }
        H = Math.round(h * 360);
        S = Math.round(s * 100);
        L = Math.round(l * 100);
      }

      rgbToHsl(rgb.r, rgb.g, rgb.b);
      const rad = (H * Math.PI) / 180;
      sumX += Math.cos(rad);
      sumY += Math.sin(rad);
      avgS += S;
      avgL += L;
    });

    avgX /= toMerge.length;
    avgY /= toMerge.length;
    avgH = Math.atan2(sumY, sumX) * (180 / Math.PI);
    if (avgH < 0) avgH += 360;
    avgS = Math.round(avgS / toMerge.length);
    avgL = Math.round(avgL / toMerge.length);

    function hslToRgb(h, s, l) {
      s /= 100;
      l /= 100;
      const k = (n) => (n + h / 30) % 12;
      const a = s * Math.min(l, 1 - l);
      const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
      avgR = Math.round(255 * f(0));
      avgG = Math.round(255 * f(8));
      avgB = Math.round(255 * f(4));
    }
    hslToRgb(avgH, avgS, avgL);

    toMerge.forEach((c) => {
      new Konva.Tween({
        node: c,
        duration: 0.5,
        x: avgX,
        y: avgY,
        radius: 0,
        easing: Konva.Easings.EaseIn,
        onFinish: () => c.destroy(),
      }).play();
    });

    const merged = new Konva.Circle({
      x: avgX,
      y: avgY,
      radius: 0,
      fill: `rgb(${avgR}, ${avgG}, ${avgB})`,
      shadowColor: `rgb(${avgR}, ${avgG}, ${avgB})`,
      draggable: false,
    });

    const art = new Konva.Circle({
      x: avgX,
      y: avgY,
      radius: Math.sqrt(totalRadius / Math.PI),
      fill: `rgb(${avgR}, ${avgG}, ${avgB})`,
      opacity: 0,
    });

    canvasLayer.add(art);
    mergeHistory.push(art);
    resetLayer.add(merged);

    merged.on(
      "mouseenter",
      () => (stage.container().style.cursor = "not-allowed"),
    );
    merged.on("mouseleave", () => (stage.container().style.cursor = "default"));
    merged.on(
      "mousedown",
      () => (stage.container().style.cursor = "not-allowed"),
    );
    merged.on(
      "mouseup",
      () => (stage.container().style.cursor = "not-allowed"),
    );

    setTimeout(function () {
      new Konva.Tween({
        node: merged,
        duration: 0.5,
        radius: Math.sqrt(totalRadius / Math.PI),
        easing: Konva.Easings.EaseOut,
      }).play();
    }, 500);

    setTimeout(function () {
      merged.moveTo(circleLayer);
      merged.draggable(true);

      merged.on("mouseenter", function () {
        merged.to({ shadowBlur: 25, shadowOpacity: 1, duration: 0.2 });
      });
      merged.on("mouseleave", function () {
        merged.to({ shadowBlur: 0, shadowOpacity: 0, duration: 0.2 });
      });

      merged.on(
        "mouseenter",
        () => (stage.container().style.cursor = "pointer"),
      );
      merged.on(
        "mouseleave",
        () => (stage.container().style.cursor = "default"),
      );
      merged.on("mousedown", () => (stage.container().style.cursor = "grab"));
      merged.on("mouseup", () => (stage.container().style.cursor = "pointer"));

      const cursorPosition = stage.getPointerPosition();
      const shapeUnderCursor = stage.getIntersection(cursorPosition);
      if (shapeUnderCursor === merged) {
        stage.container().style.cursor = "pointer";
        merged.to({ shadowBlur: 25, shadowOpacity: 1, duration: 0.2 });
      }
    }, 1000);
  }
});

// ── Artwork tab (open/close toggle) ─────────────────────────
artworkTab.addEventListener("click", function () {
  if (!canvasOpen) {
    playArtwork();
  } else {
    closeArtwork();
  }
});

// Close when clicking the dark overlay
canvasOverlay.addEventListener("click", closeArtwork);

function playArtwork() {
  if (mergeHistory.length === 0) {
    alert("You must complete a circle merge first!");
    return;
  }

  canvasOpen = true;
  canvasWrapper.classList.add("show");
  canvasOverlay.classList.add("show");
  artworkTab.textContent = "✕ Close";

  // hide save button until animation finishes
  saveArtworkBtn.classList.remove("visible");

  const totalDuration = 1000 + mergeHistory.length * 300 + 500;

  setTimeout(() => {
    mergeHistory.forEach((shape, index) => {
      shape.scale({ x: 0, y: 0 });
      shape.opacity(0.33);

      setTimeout(() => {
        new Konva.Tween({
          node: shape,
          duration: 0.5,
          scaleX: 1,
          scaleY: 1,
          easing: Konva.Easings.BackEaseOut,
        }).play();
      }, index * 300);
    });
  }, 1000);

  // show save button after animation completes
  setTimeout(() => {
    saveArtworkBtn.classList.add("visible");
  }, totalDuration);
}

function closeArtwork() {
  canvasOpen = false;
  canvasWrapper.classList.remove("show");
  canvasOverlay.classList.remove("show");
  artworkTab.textContent = "▶ Show Artwork";
  saveArtworkBtn.classList.remove("visible");
}

// ── Save PNG ─────────────────────────────────────────────────
saveArtworkBtn.addEventListener("click", function () {
  const dataURL = canvasStage.toDataURL({ pixelRatio: 2 });
  const link = document.createElement("a");
  link.download = "circle-artwork.png";
  link.href = dataURL;
  link.click();
});

// ── Reset ─────────────────────────────────────────────────────
function resetEverything() {
  circleLayer.destroyChildren();
  resetLayer.destroyChildren();
  canvasLayer.destroyChildren();
  mergeHistory = [];

  closeArtwork();

  // restore white background
  canvasLayer.add(bg);
  stage.draw();
}

resetBtn.addEventListener("click", resetEverything);

// ── Circle buttons ────────────────────────────────────────────
redCircleButton.addEventListener("click", drawNewCircle.bind(null, "#FF0000"));
greenCircleButton.addEventListener(
  "click",
  drawNewCircle.bind(null, "#00FF00"),
);
blueCircleButton.addEventListener("click", drawNewCircle.bind(null, "#0000FF"));
