// find our elements
let stageContainer = document.getElementById("stage-container");
const redCircleButton = document.getElementById("red-circle-button");
const greenCircleButton = document.getElementById("green-circle-button");
const blueCircleButton = document.getElementById("blue-circle-button");
const randomCircleButton = document.getElementById("random-circle-button");
const showArtworkBtn = document.getElementById("show-artwork");
const resetBtn = document.getElementById("reset");
const exitArtworkBtn = document.getElementById("exit-artwork");
const savePngBtn = document.getElementById("save-png");
let dateColor = document.getElementById("date-color");
const root = document.documentElement;
const styles = getComputedStyle(root);
const c3 = styles.getPropertyValue("--c3").trim();

// find stage container size
let stageContainerWidth = stageContainer.offsetWidth;
let stageContainerHeight = stageContainer.offsetHeight;

onresize = () => {
  stageContainerWidth = stageContainer.offsetWidth;
  stageContainerHeight = stageContainer.offsetHeight;
  stage.width(stageContainerWidth);
  stage.height(stageContainerHeight);
  bg.width(window.innerWidth);
  bg.height(window.innerHeight);
  canvasStage.width(window.innerWidth);
  canvasStage.height(window.innerHeight);
};

// create a stage the size of the container
const stage = new Konva.Stage({
  container: "konva-stage",
  width: stageContainerWidth,
  height: stageContainerHeight,
});

const canvasStage = new Konva.Stage({
  container: "canvas-stage",
  width: window.innerWidth,
  height: window.innerHeight,
});

// add a layer
const circleLayer = new Konva.Layer();
const resetLayer = new Konva.Layer();
const canvasLayer = new Konva.Layer();

// make final artwork canvas invisible and add white background to differentiate between the two layers
const bg = new Konva.Rect({
  x: 0,
  y: 0,
  width: window.innerWidth,
  height: window.innerHeight,
  fill: "white",
  // cant be interacted with
  listening: false,
});
canvasLayer.add(bg);

// add the layers
stage.add(circleLayer);
stage.add(resetLayer);
canvasStage.add(canvasLayer);

// keep track of all the merges order for the artwork
let mergeHistory = [];

// add circle interaction that creates a circle of a random size at a random place on the stage
function drawNewCircle(color) {
  // var group = new Konva.Group({
  //   x: stage.width() * Math.random(),
  //   y: stage.height() * Math.random(),
  //   // draggable: true,
  // });
  resetBtn.classList.add("show");
  const baseHues = {
    "hsl(0, 100%, 50%)": 0,
    "hsl(120, 100%, 50%)": 120,
    "hsl(240, 100%, 50%)": 240,
  };

  const h = Math.round(
    (baseHues[color] + (Math.random() - 0.5) * 30 + 360) % 360,
  );
  const s = Math.round(100 - Math.random() * 25);
  const l = Math.round(50 + (Math.random() - 0.5) * 25);
  const randomisedColor = `hsl(${h}, ${s}%, ${l}%)`;
  // create random size circle in random position
  const base = new Konva.Circle({
    x: stage.width() * Math.random(),
    y: stage.height() * Math.random(),
    draggable: true,
    radius: 50 * Math.random() + 20,
    fill: randomisedColor,
    shadowColor: randomisedColor,
    name: "shape",
    scale: { x: 0, y: 0 },
  });

  base.on("mouseenter", function () {
    // Animate glow on
    base.to({
      shadowBlur: 25,
      shadowOpacity: 1,
      duration: 0.2, // animation time
    });
  });

  base.on("mouseleave", function () {
    // Animate glow off
    base.to({
      shadowBlur: 0,
      shadowOpacity: 0,
      duration: 0.2,
    });
  });

  // add the circle dragging cursors
  base.on("mouseenter", () => (stage.container().style.cursor = "pointer"));
  base.on("mouseleave", () => (stage.container().style.cursor = "default"));
  base.on("mousedown", () => (stage.container().style.cursor = "grab"));
  base.on("mouseup", () => (stage.container().style.cursor = "pointer"));

  // layer.add(group);
  // group.add(circle);
  circleLayer.add(base);
  new Konva.Tween({
    node: base,
    duration: 0.5,
    scaleX: 1,
    scaleY: 1,
    easing: Konva.Easings.EaseOut,
  }).play();
}

circleLayer.on("mousedown", function (e) {
  const target = e.target;
  target.to({
    scaleX: 1.1,
    scaleY: 1.1,
    duration: 0.2,
  });
});

circleLayer.on("mouseup", function (e) {
  const target = e.target;
  target.to({
    scaleX: 1,
    scaleY: 1,
    duration: 0.2,
  });
});

// calls this function whenever a circle is dragged
circleLayer.on("dragmove", function (e) {
  // target is the dragged shape
  const target = e.target;

  let activeIntersections = [];

  // moves target to the top of the layer for clarity
  target.moveTo(resetLayer);
  target.moveTo(circleLayer);

  // gets rid of the stroke if not hovering another circle

  // checks if any circles on the page are colliding with the target
  circleLayer.children.forEach(function (circle) {
    if (circle === target) return;

    circle.to({
      shadowBlur: 0,
      shadowOpacity: 0,
      shadowColor: circle.fill(),
      duration: 0.2, // animation time
    });
    console.log(circle.fill());

    if (haveIntersection(circle, target)) {
      // applis stroke for touching circles
      circle.to({
        shadowBlur: 50,
        shadowOpacity: 1,
        shadowColor: c3,
        duration: 0.1, // animation time
      });
      target.to({
        shadowBlur: 50,
        shadowOpacity: 1,
        shadowColor: c3,
        duration: 0.1, // animation time
      });
      activeIntersections.push(circle);
    } else {
      let circleIndex = activeIntersections.indexOf(circle);
      if (circleIndex > -1) {
        activeIntersections.splice(circleIndex, 1); // Removes 1 item at 'index'
      }
    }
  });

  if (activeIntersections.length < 1) {
    target.to({
      shadowBlur: 25,
      shadowOpacity: 1,
      shadowColor: target.fill(),
      duration: 0.1, // animation time
    });
  }
});

// pythag function to determine collision
function haveIntersection(c1, c2) {
  const dx = c1.x() - c2.x();
  const dy = c1.y() - c2.y();
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < c1.radius() + 1.1 * c2.radius()) return true;
}

// fires everytime a circle is dropped
circleLayer.on("dragend", function (e) {
  const target = e.target;

  // collect all circles that intersect with target in this array
  let toMerge = [target];

  circleLayer.children.forEach(function (circle) {
    if (circle === target) return;

    if (haveIntersection(circle, target)) {
      // pushes circles to the array
      toMerge.push(circle);
      circle.draggable(false);
    }
  });

  // only merges and runs if there are 2 or more circles
  if (toMerge.length > 1) {
    target.draggable(false);
    stage.container().style.cursor = "not-allowed";

    // calculate merged properties
    let totalRadius = 0;

    let avgX = 0;
    let avgY = 0;

    let H = 0;
    let S = 0;
    let L = 0;

    let avgH = 0;
    let avgS = 0;
    let avgL = 0;

    let sumX = 0;
    let sumY = 0;

    let avgR = 0;
    let avgG = 0;
    let avgB = 0;

    toMerge.forEach((c) => {
      c.on(
        "mouseenter",
        () => (stage.container().style.cursor = "not-allowed"),
      );
      c.on("mouseleave", () => (stage.container().style.cursor = "default"));
      c.on("mouseup", () => (stage.container().style.cursor = "not-allowed"));
      c.on("mousedown", () => (stage.container().style.cursor = "not-allowed"));

      // maths that checks the values of every circle and adds/averages them
      totalRadius += Math.PI * c.radius() ** 2;

      avgX += c.x();
      avgY += c.y();

      // used chatgpts help for this bit
      const [h, s, l] = c
        .fill()
        .match(/[\d.]+/g)
        .map(Number);
      console.log(h, s, l);

      const rad = (h * Math.PI) / 180;
      sumX += Math.cos(rad);
      sumY += Math.sin(rad);

      avgS += s;
      avgL += l;
    });

    avgX /= toMerge.length;
    avgY /= toMerge.length;

    // for the rgb values the merged circles will show NaN error if the values are not integers
    avgH = Math.round(Math.atan2(sumY, sumX) * (180 / Math.PI));

    // fix negative angle
    if (avgH < 0) avgH += 360;

    avgS = Math.round(avgS / toMerge.length);
    avgL = Math.round(avgL / toMerge.length);

    // animate old circles merging down
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
    console.log(avgH, avgS, avgL);
    // create new merged circle
    const merged = new Konva.Circle({
      x: avgX,
      y: avgY,
      radius: 0,
      // uses new calculated colour
      fill: `hsl(${avgH}, ${avgS}%, ${avgL}%)`,
      shadowColor: `hsl(${avgH}, ${avgS}%, ${avgL}%)`,
      draggable: false,
    });

    // create the merged circles for artwork layer
    const art = new Konva.Circle({
      x: avgX,
      y: avgY,
      radius: Math.sqrt(totalRadius / Math.PI),
      fill: `hsl(${avgH}, ${avgS}%, ${avgL}%)`,
      // hidden initially for the animation later
      opacity: 0,
    });

    // adds artowork to canvas and array to remember order
    canvasLayer.add(art);
    mergeHistory.push(art);

    // adds merged circle
    circleLayer.add(merged);

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

    // grow merged bcircle animation that plays after the other animation finishes
    setTimeout(function () {
      new Konva.Tween({
        node: merged,
        duration: 0.5,
        radius: Math.sqrt(totalRadius / Math.PI),
        easing: Konva.Easings.EaseOut,
      }).play();
    }, 500);

    // after both animations finsih the circle can be dragged again
    setTimeout(function () {
      merged.draggable(true);

      merged.on("mouseenter", function () {
        // Animate glow on
        merged.to({
          shadowBlur: 25,
          shadowOpacity: 1,
          duration: 0.2, // animation time
        });
      });

      merged.on("mouseleave", function () {
        // Animate glow off
        merged.to({
          shadowBlur: 0,
          shadowOpacity: 0,
          duration: 0.2,
        });
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
        merged.to({
          shadowBlur: 25,
          shadowOpacity: 1,
          duration: 0.2, // animation time
        });
      }
    }, 1000);
  }
});

// function to play the artwork
function playArtwork() {
  if (mergeHistory.length === 0) {
    alert("You must complete a circle merge first!");
    return;
  }

  document.body.style.pointerEvents = "none";
  setTimeout(() => {
    document.body.style.pointerEvents = "auto";
    resetBtn.classList.remove("show");
  }, 2100);

  showArtworkBtn.classList.add("hide");
  setTimeout(() => {
    canvasStage.container().classList.add("show");
  }, 500);

  // for each shape in the merge history it plays an animation
  circleLayer.children.forEach((shape, index) => {
    setTimeout(
      () => {
        new Konva.Tween({
          node: shape,
          duration: 0.5,
          scaleX: 0,
          scaleY: 0,
          easing: Konva.Easings.EaseOut,
        }).play();
      },
      (index * 500) / circleLayer.children.length,
    );
  });

  setTimeout(() => {
    mergeHistory.forEach((shape, index) => {
      shape.scale({ x: 0, y: 0 });
      shape.opacity(0.33);

      setTimeout(
        () => {
          new Konva.Tween({
            node: shape,
            duration: 0.5,
            scaleX: 1,
            scaleY: 1,
            easing: Konva.Easings.BackEaseOut,
          }).play();
        },
        index * 600 * 0.96 ** index, // overlaps the animations a bit for better effect
      );
    });
  }, 2100);

  setTimeout(
    () => {
      exitArtworkBtn.classList.add("show");
      savePngBtn.classList.add("show");
    },
    2100 + mergeHistory.length * 300,
  );
}

// destroy button function
function resetEverything() {
  document.body.style.pointerEvents = "none";
  setTimeout(() => {
    document.body.style.pointerEvents = "auto";
  }, 1000);
  resetBtn.classList.remove("show");
  circleLayer.children.forEach((shape, index) => {
    setTimeout(
      () => {
        new Konva.Tween({
          node: shape,
          duration: 0.5,
          scaleX: 0,
          scaleY: 0,
          easing: Konva.Easings.EaseOut,
        }).play();
      },
      (index * 500) / circleLayer.children.length,
    );
  });

  setTimeout(() => {
    // destroy all circles
    circleLayer.destroyChildren();
    resetLayer.destroyChildren();
    canvasLayer.destroyChildren();

    // clear merge history
    mergeHistory = [];

    // reset back to circle layer being visible and canvas layer invis
    canvasStage.container().classList.remove("show");

    // put white background back
    canvasLayer.add(bg);

    stage.draw();
  }, 1000);
}

function exitArtwork() {
  document.body.style.pointerEvents = "none";
  setTimeout(() => {
    document.body.style.pointerEvents = "auto";
  }, 1500);

  canvasLayer.children.forEach((shape, index) => {
    if (shape === bg) return;
    setTimeout(
      () => {
        new Konva.Tween({
          node: shape,
          duration: 0.5,
          scaleX: 0,
          scaleY: 0,
          easing: Konva.Easings.EaseOut,
        }).play();
      },
      (index * 500) / (canvasLayer.children.length - 1),
    );
  });

  savePngBtn.classList.remove("show");
  exitArtworkBtn.classList.remove("show");

  setTimeout(() => {
    canvasStage.container().classList.remove("show");
    showArtworkBtn.classList.remove("hide");
    setTimeout(() => {
      // destroy all circles
      circleLayer.destroyChildren();
      resetLayer.destroyChildren();
      canvasLayer.destroyChildren();

      // clear merge history
      mergeHistory = [];

      // reset back to circle layer being visible and canvas layer invis
      canvasStage.container().classList.remove("show");

      // put white background back
      canvasLayer.add(bg);

      stage.draw();
    }, 1500);
  }, 500);
}

function savePng() {
  const dataURL = canvasStage.toDataURL({
    mimeType: "image/png",
    pixelRatio: 4,
  });

  const link = document.createElement("a");

  link.href = dataURL;
  link.download = "artwork.png";

  link.click();
}

// listens for when each of the buttons are pressed and runs their respective functions
redCircleButton.addEventListener(
  "click",
  drawNewCircle.bind(null, "hsl(0, 100%, 50%)"),
);
greenCircleButton.addEventListener(
  "click",
  drawNewCircle.bind(null, "hsl(120, 100%, 50%)"),
);
blueCircleButton.addEventListener(
  "click",
  drawNewCircle.bind(null, "hsl(240, 100%, 50%)"),
);
randomCircleButton.addEventListener(
  "click",
  drawNewCircle.bind(null, `hsl(${Math.random() * 360}, 100%, 50%)`),
);

showArtworkBtn.addEventListener("click", playArtwork);

resetBtn.addEventListener("click", resetEverything);

exitArtworkBtn.addEventListener("click", exitArtwork);

savePngBtn.addEventListener("click", savePng);
