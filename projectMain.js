// find our elements
let stageContainer = document.getElementById("stage-container");
const circleButton = document.getElementById("circle-button");
let dateColor = document.getElementById("date-color");
const root = document.documentElement;

// find stage container size
let stageContainerWidth = stageContainer.offsetWidth;
const stageContainerHeight = stageContainer.offsetHeight;
// circle circlets off as black so that no circles show on the background at the circle (probably could add a *required code rather than drawing black circles but hey it works)
let circleColor = "blue";

// create a stage the size of the container
const stage = new Konva.Stage({
  container: "konva-stage",
  width: stageContainerWidth,
  height: stageContainerHeight,
});

// add a layer
const circleLayer = new Konva.Layer();
const resetLayer = new Konva.Layer();
stage.add(circleLayer);
stage.add(resetLayer);

// keep track of shape number
let shapeNumber = 1;
let previousShape;

// add circle interaction that creates a circle of a random size at a random place on the stage
function drawNewCircle() {
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
    fill: circleColor,
    name: "shape", // + shapeNumber,
    // stroke: "white",
    // strokeWidth: 0,
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

  circleLayer.children.forEach(function (circle) {
    if (circle === target) return;

    if (haveIntersection(circle, target)) {
      circle.fill("red");
      target.fill("red");
    } else {
      circle.fill(circleColor);
      target.fill(circleColor);
    }
  });
});

function haveIntersection(c1, c2) {
  const dx = c1.x() - c2.x();
  const dy = c1.y() - c2.y();
  const distance = Math.sqrt(dx * dx + dy * dy);

  return distance < c1.radius() + c2.radius();
}

circleLayer.on("dragend", function (e) {
  const target = e.target;

  // collect all circles that intersect with target (including chained ones)
  let toMerge = [target];

  circleLayer.children.forEach(function (circle) {
    if (circle === target) return;

    if (haveIntersection(circle, target)) {
      toMerge.push(circle);
    }
  });

  // if only one circle, nothing to merge
  if (toMerge.length > 1) {
    // calculate merged properties
    let totalRadius = 0;
    let avgX = 0;
    let avgY = 0;

    toMerge.forEach((c) => {
      totalRadius += c.radius();
      avgX += c.x();
      avgY += c.y();
    });

    avgX /= toMerge.length;
    avgY /= toMerge.length;

    // destroy all merged circles
    toMerge.forEach((c) => c.destroy());

    // create merged circle
    const merged = new Konva.Circle({
      x: avgX,
      y: avgY,
      radius: totalRadius,
      fill: circleColor,
      draggable: true,
      stroke: "white",
      strokeWidth: 0,
    });

    // cursor handlers
    merged.on("mouseenter", () => (stage.container().style.cursor = "pointer"));
    merged.on("mouseleave", () => (stage.container().style.cursor = "default"));
    merged.on("mousedown", () => (stage.container().style.cursor = "grab"));
    merged.on("mouseup", () => (stage.container().style.cursor = "pointer"));

    circleLayer.add(merged);
  }
});

// listens for when the create new circle button is clicked and runs the above function
circleButton.addEventListener("click", drawNewCircle);

layer.on("dragend", function (e) {
  const target = e.target;

  layer.children.forEach(function (circle) {
    if (circle === target) return;

    if (haveIntersection(circle, target)) {
      const newRadius = circle.radius() + target.radius();
      const newX = (circle.x() + target.x()) / 2;
      const newY = (circle.y() + target.y()) / 2;

      circle.destroy();
      target.destroy();

      const merged = new Konva.Circle({
        x: newX,
        y: newY,
        radius: newRadius,
        fill: circleColor,
        draggable: true,
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

      layer.add(merged);
    }
  });
});
