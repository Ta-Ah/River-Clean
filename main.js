import './style.css'

import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer;
let controls, water, sun;

const loader = new GLTFLoader();

function random(min, max) {
  return Math.random() * (max - min) + min;
}

//BOAT

class Boat2
{ 
  constructor(){
    loader.load("pictures/boat/scene.gltf", (gltf) => {
      // console.log(gltf);
      scene.add(gltf.scene);
      gltf.scene.scale.set(3,3.5,3.5);
      gltf.scene.position.set(2,-1,0);
      gltf.scene.rotation.set(0,3.0,0);

      this.boat = gltf.scene

      this.speed ={pos: 0, rotate: 0 }
     })
  }

  update()
  {
    if(this.boat){
      //this.boat.position.y += 0.01
      this.boat.translateZ(this.speed.pos)
      this.boat.rotation.y += this.speed.rotate
    } 
  }

  stop()
  { this.speed.pos = 0
    this.speed.rotate = 0 }

}

const boat = new Boat2()

//TRASH

class Trash{
  constructor(_scene){
    scene.add( _scene )
    _scene.scale.set(.2, .2, .2)
    if(Math.random() > .6){
      _scene.position.set(random(-160, 160),-.3, random(-160, 160))
    }else{
      _scene.position.set(random(-500, 500), 0, random(-1000, 1000))
    }
    
    this.trash = _scene
  }
}

class Trash2{
  constructor(_scene){
    scene.add( _scene )
    _scene.scale.set(1, 1.5, 1)
    if(Math.random() > .6){
      _scene.position.set(random(-160, 160), -.8, random(-160, 160))
    }else{
      _scene.position.set(random(-500, 500), 0, random(-1000, 1000))
    }
    
    this.trash2 = _scene
  }
}

async function loadModel(url){
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => {
      resolve(gltf.scene)
    })
  })
}

let boatModel = null
let boatModel2 = null

async function createTrash(){
    // Load and clone the boat model
    if (!boatModel) {
      boatModel = await loadModel("pictures/bottle/scene.gltf");
    }
    return new Trash(boatModel.clone());
    
  
}

async function createTrash2(){
  // Load and clone the boat model
  if (!boatModel2) {
    boatModel2 = await loadModel("pictures/garbage_bag/scene.gltf");
  }
  return new Trash2(boatModel2.clone());

}

let trashes = []
const TRASH_COUNT = 100

init();
animate();

async function init() {

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  document.body.appendChild( renderer.domElement );

  //

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
  camera.position.set( 12, 40, 110 );

  //

  sun = new THREE.Vector3();

  // Water

  const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

  water = new Water(
    waterGeometry,
    {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load( 'pictures/waternormals.jpg', function ( texture ) {

        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

      } ),
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: scene.fog !== undefined
    }
  );

  water.rotation.x = - Math.PI / 2;

  scene.add( water );

  // Skybox

  const sky = new Sky();
  sky.scale.setScalar( 10000 );
  scene.add( sky );

  const skyUniforms = sky.material.uniforms;

  skyUniforms[ 'turbidity' ].value = 10;
  skyUniforms[ 'rayleigh' ].value = 2;
  skyUniforms[ 'mieCoefficient' ].value = 0.005;
  skyUniforms[ 'mieDirectionalG' ].value = 0.8;

  const parameters = {
    elevation: 2,
    azimuth: 180
  };

  const pmremGenerator = new THREE.PMREMGenerator( renderer );
  let renderTarget;

  function updateSun() {

    const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
    const theta = THREE.MathUtils.degToRad( parameters.azimuth );

    sun.setFromSphericalCoords( 1, phi, theta );

    sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
    water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

    if ( renderTarget !== undefined ) renderTarget.dispose();

    renderTarget = pmremGenerator.fromScene( sky );

    scene.environment = renderTarget.texture;

  }

  updateSun();


  controls = new OrbitControls( camera, renderer.domElement );
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.target.set( 0, 10, 0 );
  controls.minDistance = 40.0;
  controls.maxDistance = 200.0;
  controls.update();

  

  const waterUniforms = water.material.uniforms;

  window.addEventListener( 'resize', onWindowResize );
  window.addEventListener('keydown',function(e){
    //this.alert(event.key)
    if(e.key == "ArrowUp")
    {
      boat.speed.pos = .9
    }

    if(e.key == "ArrowDown")
    {
      boat.speed.pos = -.7
    }
    if(e.key == "ArrowRight")
    {
      boat.speed.rotate = -.1
    }
    if(e.key == "ArrowLeft")
    {
      boat.speed.rotate = .1
    }
  })

  window.addEventListener('keyup',function(e){
    boat.stop()
   
  })

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

for(let i = 0; i < TRASH_COUNT; i++){
  const trashInstance = await createTrash()
  trashes.push(trashInstance)
}

for(let i = 0; i < TRASH_COUNT; i++){
  const trashInstance = await createTrash2()
  trashes.push(trashInstance)
}

function animate() {
  console.log('animate')
  requestAnimationFrame( animate );
  render();
  boat.update()
  checkCollisions()
  

}

function render() {

  water.material.uniforms[ 'time' ].value += 1.0 / 60.0;

  renderer.render( scene, camera );


}

function removeTrash(obj1, obj2, maxDistance = 15) {
  const position1 = obj1.position;
  const position2 = obj2.position;

  const distanceX = Math.abs(position1.x - position2.x);
  const distanceZ = Math.abs(position1.z - position2.z);

  return distanceX < maxDistance && distanceZ < maxDistance;
}


function checkCollisions(){
  if(boat.boat){
    trashes.forEach(trash => {
      if(trash.trash){
        if(removeTrash(boat.boat, trash.trash)){
          scene.remove(trash.trash)
        }
      }
      if(trash.trash2){
        if(removeTrash(boat.boat, trash.trash2)){
          scene.remove(trash.trash2)
        }
      }
    })
  }
}


