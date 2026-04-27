// find our elements
let stageContainer = document.getElementById("stage-container");
const redCircleButton = document.getElementById("red-circle-button");
const greenCircleButton = document.getElementById("green-circle-button");
const blueCircleButton = document.getElementById("blue-circle-button");
const showArtworkBtn = document.getElementById("show-artwork");
const resetBtn = document.getElementById("reset");
let dateColor = document.getElementById("date-color");
const root = document.documentElement;

// find stage container size
let stageContainerWidth = stageContainer.offsetWidth;
let stageContainerHeight = stageContainer.offsetHeight;

onresize = () => {
  stageContainerWidth = stageContainer.offsetWidth;
  stageContainerHeight = stageContainer.offsetHeight;
  stage.width(stageContainerWidth);
  stage.height(stageContainerHeight);
};

// create a stage the size of the container
const stage = new Konva.Stage({
  container: "konva-stage",
  width: stageContainerWidth,
  height: stageContainerHeight,
});

// add a layer
const circleLayer = new Konva.Layer();
const resetLayer = new Konva.Layer();
const canvasLayer = new Konva.Layer();

canvasLayer.visible(false);

canvasLayer.add(
  new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    fill: "white",
    listening: false,
  }),
);

stage.add(circleLayer);
stage.add(resetLayer);
stage.add(canvasLayer);

// keep track of shape number
let shapeNumber = 1;
let previousShape;
let mergeHistory = [];

// add circle interaction that creates a circle of a random size at a random place on the stage
function drawNewCircle(color) {
  // var group = new Konva.Group({
  //   x: stage.width() * Math.random(),
  //   y: stage.height() * Math.random(),
  //   // draggable: true,
  // });

  const base = new Konva.Circle({
    x: stage.width() * Math.random(),
    y: stage.height() * Math.random(),
    draggable: true,
    radius: 50 * Math.random(),
    fill: color,
    name: "shape", // + shapeNumber,
    stroke: "white",
    strokeWidth: 0,
  });

  // add 1 to the shape number
  shapeNumber += 1;

  // add the circle dragging cursors
  base.on("mouseenter", () => (stage.container().style.cursor = "pointer"));
  base.on("mouseleave", () => (stage.container().style.cursor = "default"));
  base.on("mousedown", () => (stage.container().style.cursor = "grab"));
  base.on("mouseup", () => (stage.container().style.cursor = "pointer"));

  // layer.add(group);
  // group.add(circle);
  circleLayer.add(base);
}

circleLayer.on("dragmove", function (e) {
  const target = e.target;

  target.moveTo(resetLayer);
  target.moveTo(circleLayer);

  circleLayer.children.forEach((c) => c.strokeWidth(0));

  circleLayer.children.forEach(function (circle) {
    if (circle === target) return;

    if (haveIntersection(circle, target)) {
      circle.strokeWidth(5);
      target.strokeWidth(5);
    }
  });
});

function haveIntersection(c1, c2) {
  const dx = c1.x() - c2.x();
  const dy = c1.y() - c2.y();
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < c1.radius() + c2.radius()) return true;
}

circleLayer.on("dragend", function (e) {
  const target = e.target;

  // collect all circles that intersect with target
  let toMerge = [target];

  circleLayer.children.forEach(function (circle) {
    if (circle === target) return;

    if (haveIntersection(circle, target)) {
      toMerge.push(circle);
      circle.draggable(false);
    }
  });

  // only merge if there are 2 or more circles
  if (toMerge.length > 1) {
    target.draggable(false);
    stage.container().style.cursor = "not-allowed";

    // calculate merged properties
    let totalRadius = 0;

    let avgX = 0;
    let avgY = 0;

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

      totalRadius += c.radius();

      avgX += c.x();
      avgY += c.y();

      const rgb = Konva.Util.getRGB(c.fill());
      avgR += rgb.r;
      avgG += rgb.g;
      avgB += rgb.b;
    });

    avgX /= toMerge.length;
    avgY /= toMerge.length;

    // for the rgb values the merged circles will show NaN error if the values are not integers
    avgR = Math.round(avgR / toMerge.length);
    avgG = Math.round(avgG / toMerge.length);
    avgB = Math.round(avgB / toMerge.length);

    // animate old circles into blob
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

    // create new merged circle
    const merged = new Konva.Circle({
      x: avgX,
      y: avgY,
      radius: 0,
      fill: `rgb(${avgR}, ${avgG}, ${avgB})`,
      draggable: false,
      stroke: "white",
      strokeWidth: 0,
    });

    // create circles for artwork
    const art = new Konva.Circle({
      x: avgX,
      y: avgY,
      radius: totalRadius,
      fill: `rgb(${avgR}, ${avgG}, ${avgB})`,
      opacity: 0, // hidden initially
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

    // grow merged blob
    setTimeout(function () {
      new Konva.Tween({
        node: merged,
        duration: 0.5,
        radius: totalRadius,
        easing: Konva.Easings.EaseOut,
      }).play();
    }, 500);

    setTimeout(function () {
      merged.moveTo(circleLayer);
      merged.draggable(true);
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
      }
    }, 1000);
  }
});

function playArtwork() {
  if (mergeHistory.length === 0) {
    alert("You must complete a circle merge first!");
    return;
  }

  canvasLayer.visible(true);
  circleLayer.visible(false);

  mergeHistory.forEach((shape, index) => {
    shape.scale({ x: 0, y: 0 });
    shape.opacity(1);

    setTimeout(() => {
      new Konva.Tween({
        node: shape,
        duration: 0.5,
        scaleX: 1,
        scaleY: 1,
        easing: Konva.Easings.BackEaseOut,
      }).play();
    }, index * 300); // delay in order
  });
}

function resetEverything() {
  // destroy all circles
  circleLayer.destroyChildren();
  resetLayer.destroyChildren();
  canvasLayer.destroyChildren();

  // clear merge history
  mergeHistory = [];

  // reset back to circle layer being visible and canvas layer invis
  circleLayer.visible(true);
  canvasLayer.visible(false);

  canvasLayer.add(
    new Konva.Rect({
      x: 0,
      y: 0,
      width: stage.width(),
      height: stage.height(),
      fill: "white",
      listening: false,
    }),
  );

  stage.draw();
}

// listens for when the create new circle button is clicked and runs the above function
redCircleButton.addEventListener("click", drawNewCircle.bind(null, "#FF0000"));
greenCircleButton.addEventListener(
  "click",
  drawNewCircle.bind(null, "#00FF00"),
);
blueCircleButton.addEventListener("click", drawNewCircle.bind(null, "#0000FF"));

showArtworkBtn.addEventListener("click", playArtwork);

resetBtn.addEventListener("click", resetEverything);
