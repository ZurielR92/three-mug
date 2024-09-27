import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three'
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import Mug from "./assets/model1.glb";
import Image1 from "./assets/model1_img0.jpg";
import Image2 from "./assets/model2_img0.jpg";
import Image3 from "./assets/model3_img0.jpg";
import Image4 from "./assets/model4_img0.jpg";


let   container:any;
let  camera:any;
let  scene:any;
let  renderer:any;
let  orbitControls:any;
let  textureSelector:any;
let  colorSelector:any;
let  mesh:any;
let  decalGeometry:any;
let  material:any;

const init = () => {
  scene = new THREE.Scene();

  // Note: The near and far planes can be set this way due to the use of "logarithmicDepthBuffer" in the renderer below.
  camera = new THREE.PerspectiveCamera(
    20,
    container.offsetWidth / container.offsetHeight,
    1e-5,
    1e10
  );

  scene.add(camera);


  // Añadir una luz ambiental
  const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Luz blanca
  scene.add(ambientLight);

  // Añadir una luz direccional
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);


  // RENDERER
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    logarithmicDepthBuffer: true
  });
  renderer.setClearColor(0xffffff);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = (THREE as any).sRGBEncoding;

  container.appendChild(renderer.domElement);

  const loader = new GLTFLoader();

  const cameraPos = new THREE.Vector3(-0.2, 0.4, 1.4);
  orbitControls = new OrbitControls(camera, renderer.domElement);

  (loader as any).load(
    Mug,
    (gltf:any) => {
      const object = gltf.scene;

      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      // Center the model on screen based on bounding box information.
      object.updateMatrixWorld();
      const boundingBox = new THREE.Box3().setFromObject(object);
      const modelSizeVec3 = new THREE.Vector3();
      boundingBox.getSize(modelSizeVec3);
      const modelSize = modelSizeVec3.length();
      const modelCenter = new THREE.Vector3();
      boundingBox.getCenter(modelCenter);

      // Set up mouse orbit controls.
      orbitControls.reset();
      orbitControls.maxDistance = modelSize * 50;
      orbitControls.enableDamping = true;
      orbitControls.dampingFactor = 0.07;
      orbitControls.rotateSpeed = 1.25;
      orbitControls.panSpeed = 1.25;
      orbitControls.screenSpacePanning = true;
      orbitControls.autoRotate = true;

      // Position the camera accordingly.
      object.position.x = -modelCenter.x;
      object.position.y = -modelCenter.y;
      object.position.z = -modelCenter.z;
      camera.position.copy(modelCenter);
      camera.position.x += modelSize * cameraPos.x;
      camera.position.y += modelSize * cameraPos.y;
      camera.position.z += modelSize * cameraPos.z;
      camera.near = modelSize / 100;
      camera.far = modelSize * 100;
      camera.updateProjectionMatrix();
      camera.lookAt(modelCenter);

      object.traverse((obj:any) => {
        console.log("obj", obj);
        if (
          obj instanceof THREE.Mesh &&
          obj.name === "Mug_Porcelain_PBR001_0"
        ) {
          material = obj.material;
          console.log("material", material);

          mesh = obj;

          // addDecal();

          textureSelector.addEventListener("input", (event:any) => {
            material.map = convertImageToTexture(event.target.value);
            console.log("material", material);
          });
        } else if (
          obj instanceof THREE.Mesh &&
          obj.name === "Mug_Porcelain_PBR002_0"
        ) {
          const material = obj.material;

          colorSelector.addEventListener("input", (event:any) => {
            material.color.set(event.target.value);
          });
        }
      });

      scene.add(object);
      onWindowResize();
    },
    function (error:any) {
      // console.error(error);
    }
  );
};

const addDecal = () => {
  if (mesh === undefined || decalGeometry !== undefined) return;

  const decalMaterial = material.clone();
  decalMaterial.depthTest = true;
  decalMaterial.depthWrite = false;
  decalMaterial.polygonOffset = true;
  decalMaterial.polygonOffsetFactor = -4;

  const position = new THREE.Vector3();
  const orientation = new THREE.Euler();

  new THREE.TextureLoader().load(Image2, (texture) => {
    (texture as any).encoding = (THREE as any).sRGBEncoding;
    // texture.flipY = false;
    const size = new THREE.Vector3(50, 50, 50);

    decalMaterial.map = texture;
    // decalMaterial.normalMap = texture;
    // material.color.set("#000000");
    // material.needsUpdate = true;

    decalGeometry = new DecalGeometry(mesh, position, orientation, size);
    const decalMesh = new THREE.Mesh(decalGeometry, decalMaterial);

    console.log("decalMesh", decalMesh);
    console.log("mesh", mesh);

    scene.add(decalMesh);
  });
};

const onWindowResize = () => {
  camera.aspect = container.offsetWidth / container.offsetHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
};

const convertImageToTexture = (image:any) => {
  const textureLoader = new THREE.TextureLoader();
  let texture = textureLoader.load(image);
  (texture as any).encoding = (THREE as any).sRGBEncoding;
  texture.flipY = false;
  //texture.offset.setY(0.5);

  // texture.repeat.x = 1;
  console.log("offset", texture.offset);
  // console.log("wrapS", texture.wrapS);
  // console.log("wrapT", texture.wrapT);

  return texture;
};

const ThreeJSExample = () => {
  const animate = useCallback(() => {
    requestAnimationFrame(() => animate());

    orbitControls.update();
    // updateTexture();
    renderer.render(scene, camera);
  }, []);

  const ref = useRef(null);
  const textureRef = useRef(null);
  const colorRef = useRef(null);

  useEffect(() => {
    container = ref.current;
    textureSelector = textureRef.current;
    colorSelector = colorRef.current;
  
    if (container && !container.hasChildNodes()) {
      init();
      animate();
    }
  
    window.addEventListener("resize", onWindowResize, false);
    return () => {
      window.removeEventListener("resize", onWindowResize, false);
    };
  }, [animate]);

  return (
    <div className="preview">
      <div className="controls">
        <div>
          <p>Texture</p>
          <select id="imageSelector" ref={textureRef}>
            <option value={Image1}>Image 1</option>
            <option value={Image2}>Image 2</option>
            <option value={Image3}>Image 3</option>
            <option value={Image4}>Image 4</option>
          </select>
        </div>
        <div>
          <p>Color</p>
          <input
            type="color"
            id="colorPicker"
            name="favcolor"
            defaultValue="#ffffff"
            ref={colorRef}
          />
        </div>
      </div>
      <div ref={ref} />
    </div>
  );
};

export default ThreeJSExample;
