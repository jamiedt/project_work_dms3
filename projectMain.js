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
const layer = new Konva.Layer();
const dragLayer = new Konva.Layer();
stage.add(layer);
stage.add(dragLayer);

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

  const circle = new Konva.Circle({
    x: stage.width() * Math.random(),
    y: stage.height() * Math.random(),
    draggable: true,
    radius: 50 * Math.random(),
    fill: circleColor,
    name: "shape", // + shapeNumber,
    stroke: "white",
    strokeWidth: 0,
  });

  // add 1 to the shape number
  shapeNumber += 1;

  // add the circle dragging cursors
  circle.on("mouseenter", function () {
    stage.container().style.cursor = "pointer";
  });
  circle.on("mouseleave", function () {
    stage.container().style.cursor = "default";
  });
  circle.on("mousedown", function () {
    stage.container().style.cursor = "grab";
  });
  circle.on("mouseup", function () {
    stage.container().style.cursor = "pointer";
  });

  // layer.add(group);
  // group.add(circle);
  layer.add(circle);
}

layer.on("dragmove", function (e) {
  var target = e.target;
  var targetRect = e.target.getClientRect();

  target.moveTo(dragLayer);
  target.moveTo(layer);

  layer.children.forEach(function (circle) {
    // do not check intersection with itself
    if (circle === target) {
      return;
    }
    if (haveIntersection(circle.getClientRect(), targetRect)) {
      circle.fill("red");
    } else {
      circle.fill("grey");
    }
  });
});

function haveIntersection(r1, r2) {
  return !(
    r2.x > r1.x + r1.width ||
    r2.x + r2.width < r1.x ||
    r2.y > r1.y + r1.height ||
    r2.y + r2.height < r1.y
  );
}

// listens for when the create new circle button is clicked and runs the above function
circleButton.addEventListener("click", drawNewCircle);
