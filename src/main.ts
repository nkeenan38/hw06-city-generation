import {vec3, mat3} from 'gl-matrix';
import * as Stats from 'stats-js';
import * as DAT from 'dat-gui';
import Square from './geometry/Square';
import Mesh from './geometry/Mesh';
import ScreenQuad from './geometry/ScreenQuad';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import {readTextFile} from './globals';
import ExpansionRule from './lsystem/ExpansionRule';
import DrawingRule from './lsystem/DrawingRule';
import {Action} from './lsystem/DrawingRule';
import LSystem from './lsystem/LSystem';
import Road from './geometry/Road';
import Prism from './geometry/Prism';


// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  terrain: 'Detailed',
  population: 'Detailed',
  threshold: 0.4,
  seaLevel: 0.5
};

let terrainType: string = controls.terrain;
let populationType: string = controls.population;
let populationThreshold: number = controls.threshold;
let seaLevel: number = controls.seaLevel;

let square: Square;
let mesh: Mesh;
let road: Road;
let screenQuad: ScreenQuad;
let prism: Prism;
let time: number = 0.0;

function loadScene() {
  square = new Square();
  square.create();
  screenQuad = new ScreenQuad();
  screenQuad.create();
  road = new Road();
  road.create();
  prism = new Prism(0.1, 0.0125, 4);
  prism.create();

  let lsystem = new LSystem(populationThreshold, seaLevel);
  let instances = lsystem.expand();

  let col1Arr = [];
  let col2Arr = [];
  let col3Arr = [];
  let col4Arr = [];
  for (let instance of instances)
  {
    col1Arr.push(instance[0], instance[1], instance[2], 0);
    col2Arr.push(instance[3], instance[4], instance[5], 0);
    col3Arr.push(instance[6], instance[7], instance[8], 0);
    col4Arr.push(0, 0, 0, 1);
  }

  let col1 : Float32Array = new Float32Array(col1Arr);
  let col2 : Float32Array = new Float32Array(col2Arr);
  let col3 : Float32Array = new Float32Array(col3Arr);
  let col4 : Float32Array = new Float32Array(col4Arr);

  road.setNumInstances(instances.length);
  road.setInstanceVBOs(col1, col2, col3, col4);


  let buildings = lsystem.getBuildings();

  col1Arr = [];
  col2Arr = [];
  col3Arr = [];
  col4Arr = [];
  for (let instance of buildings)
  {
    col1Arr.push(instance[0], instance[1], instance[2], instance[3]);
    col2Arr.push(instance[4], instance[5], instance[6], instance[7]);
    col3Arr.push(instance[8], instance[9], instance[10], instance[11]);
    col4Arr.push(instance[12], instance[13], instance[14], instance[15]);
  }

  col1 = new Float32Array(col1Arr);
  col2 = new Float32Array(col2Arr);
  col3 = new Float32Array(col3Arr);
  col4 = new Float32Array(col4Arr);
  console.log(col4);
  prism.setNumInstances(buildings.length);
  prism.setInstanceVBOs(col1, col2, col3, col4);
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'terrain', [ 'Detailed', 'Simple', 'None' ] );
  gui.add(controls, 'population', ['Detailed', 'Simple', 'None']);
  gui.add(controls, 'threshold', 0, 1).step(0.1);
  gui.add(controls, 'seaLevel', 0, 1).step(0.05);

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(50, 50, 50), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const roadShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-instanced-frag.glsl')),
  ]);

  const buildingShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/instanced-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/instanced-frag.glsl')),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/flat-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/flat-frag.glsl')),
  ]);

  flat.setTerrainType(terrainType === 'Detailed' ? 0 :
                      terrainType === 'Simple'   ? 1 : 2);
  flat.setPopulationType(populationType === 'Detailed' ? 0 :
                         populationType === 'Simple'   ? 1 : 2);
  flat.setSeaLevel(seaLevel);

  // This function will be called every frame
  function tick() {
    if (terrainType !== controls.terrain)
    {
      terrainType = controls.terrain;
      flat.setTerrainType(terrainType === 'Detailed' ? 0 :
                          terrainType === 'Simple'   ? 1 : 2);
    }
    if (populationType !== controls.population)
    {
      populationType = controls.population;
      flat.setPopulationType(populationType === 'Detailed' ? 0 :
                             populationType === 'Simple'   ? 1 : 2);    
    }
    if (populationThreshold !== controls.threshold)
    {
      populationThreshold = controls.threshold;
      loadScene();
    }
    if (seaLevel !== controls.seaLevel)
    {
      seaLevel = controls.seaLevel;
      flat.setSeaLevel(seaLevel);
      loadScene();
    }
    camera.update();
    stats.begin();
    roadShader.setTime(time);
    buildingShader.setTime(time);
    flat.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, roadShader, [road]);
    renderer.render(camera, buildingShader, [prism]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
    flat.setDimensions(window.innerWidth, window.innerHeight);
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
