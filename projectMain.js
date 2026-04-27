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

// make final artwork canvas invisible and add white background to differentiate between the two layers
canvasLayer.visible(false);
canvasLayer.add(
  new Konva.Rect({
    x: 0,
    y: 0,
    width: stage.width(),
    height: stage.height(),
    fill: "white",
    // cant be interacted with
    listening: false,
  }),
);

// add the layers
stage.add(circleLayer);
stage.add(resetLayer);
stage.add(canvasLayer);

// keep track of all the merges order for the artwork
let mergeHistory = [];

// add circle interaction that creates a circle of a random size at a random place on the stage
function drawNewCircle(color) {
  // var group = new Konva.Group({
  //   x: stage.width() * Math.random(),
  //   y: stage.height() * Math.random(),
  //   // draggable: true,
  // });

  // create random size circle in random position
  const base = new Konva.Circle({
    x: stage.width() * Math.random(),
    y: stage.height() * Math.random(),
    draggable: true,
    radius: 50 * Math.random(),
    fill: color,
    name: "shape",
    stroke: "white",
    strokeWidth: 0,
  });

  // add the circle dragging cursors
  base.on("mouseenter", () => (stage.container().style.cursor = "pointer"));
  base.on("mouseleave", () => (stage.container().style.cursor = "default"));
  base.on("mousedown", () => (stage.container().style.cursor = "grab"));
  base.on("mouseup", () => (stage.container().style.cursor = "pointer"));

  // layer.add(group);
  // group.add(circle);
  circleLayer.add(base);
}

// calls this function whenever a circle is dragged
circleLayer.on("dragmove", function (e) {
  // target is the dragged shape
  const target = e.target;

  // moves target to the top of the layer for clarity
  target.moveTo(resetLayer);
  target.moveTo(circleLayer);

  // gets rid of the stroke if not hovering another circle
  circleLayer.children.forEach((c) => c.strokeWidth(0));

  // checks if any circles on the page are colliding with the target
  circleLayer.children.forEach(function (circle) {
    if (circle === target) return;

    // applis stroke for touching circles
    if (haveIntersection(circle, target)) {
      circle.strokeWidth(5);
      target.strokeWidth(5);
    }
  });
});

// pythag function to determine collision
function haveIntersection(c1, c2) {
  const dx = c1.x() - c2.x();
  const dy = c1.y() - c2.y();
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < c1.radius() + c2.radius()) return true;
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

    let avgR = 0;
    let avgG = 0;
    let avgB = 0;

    // maths that checks the values of every circle and adds/averages them
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

    // create new merged circle
    const merged = new Konva.Circle({
      x: avgX,
      y: avgY,
      radius: 0,
      // uses new calculated colour
      fill: `rgb(${avgR}, ${avgG}, ${avgB})`,
      draggable: false,
      stroke: "white",
      strokeWidth: 0,
    });

    // create the merged circles for artwork layer
    const art = new Konva.Circle({
      x: avgX,
      y: avgY,
      radius: totalRadius,
      fill: `rgb(${avgR}, ${avgG}, ${avgB})`,
      // hidden initially for the animation later
      opacity: 0,
    });

    // adds artowork to canvas and array to remember order
    canvasLayer.add(art);
    mergeHistory.push(art);

    // adds merged circle
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

    // grow merged bcircle animation that plays after the other animation finishes
    setTimeout(function () {
      new Konva.Tween({
        node: merged,
        duration: 0.5,
        radius: totalRadius,
        easing: Konva.Easings.EaseOut,
      }).play();
    }, 500);

    // after both animations finsih the circle can be dragged again
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

// function to play the artwork
function playArtwork() {
  if (mergeHistory.length === 0) {
    alert("You must complete a circle merge first!");
    return;
  }

  // changes to canvas layer
  canvasLayer.visible(true);
  circleLayer.visible(false);

  // for each shape in the merge history it plays an animation
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
    }, index * 300);
  });
}

// destroy button function
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

  // put white background back
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

// listens for when each of the buttons are pressed and runs their respective functions
redCircleButton.addEventListener("click", drawNewCircle.bind(null, "#FF0000"));
greenCircleButton.addEventListener(
  "click",
  drawNewCircle.bind(null, "#00FF00"),
);
blueCircleButton.addEventListener("click", drawNewCircle.bind(null, "#0000FF"));

showArtworkBtn.addEventListener("click", playArtwork);

resetBtn.addEventListener("click", resetEverything);
