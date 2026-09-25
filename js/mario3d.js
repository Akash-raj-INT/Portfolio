/* ==========================================================================
   Super Mario 64 Title Screen & Studio-Grade WebGL 3D Engine
   - Custom 3D Mario Head Mesh Generation & Elastic Spring Face Physics
   - Atmospheric 3D Particle Starfield & Volumetric Depth Lighting
   - Cinematic GSAP ScrollTrigger 3D Camera Trajectory & Parallax
   - Material Presets (Classic, Metal Mario, Gold, Cyber Wireframe)
   - Dynamic Performance Scaling & Mobile Optimization
   ========================================================================== */

class Mario3DEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.container = document.getElementById('mario-canvas-container') || document.body;
    
    this.isMobile = window.innerWidth < 768;
    
    // Scene dimensions
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    
    // Mouse / Touch tracking
    this.mouse = new THREE.Vector2();
    this.targetRotation = new THREE.Vector2();
    this.currentRotation = new THREE.Vector2();
    this.parallaxOffset = new THREE.Vector2();
    
    // Scroll tracking & GSAP Camera Targets
    const initialX = this.isMobile ? 0 : 2.0;
    const initialY = this.isMobile ? 1.4 : 0.1;
    const initialZ = this.isMobile ? -1.2 : 0.2;
    const initialCamZ = this.isMobile ? 10.5 : 9;
    this.targetCamPos = new THREE.Vector3(0, 0, initialCamZ);
    this.currentCamPos = new THREE.Vector3(0, 0, initialCamZ);
    this.marioTargetPos = new THREE.Vector3(initialX, initialY, initialZ);
    this.marioCurrentPos = new THREE.Vector3(initialX, initialY, initialZ);
    
    // Deform / Drag state for SM64 Face Stretch
    this.isDragging = false;
    this.draggedVertexIndices = [];
    this.dragWeights = [];
    this.dragStartPoint = new THREE.Vector3();
    this.dragPlane = new THREE.Plane();
    this.raycaster = new THREE.Raycaster();
    
    // Physics constants for Face Rebound
    this.stiffness = 0.12;
    this.damping = 0.82;
    this.deformRadius = 1.2;
    
    // Material presets
    this.currentStyle = 'classic';

    this.init();
  }

  init() {
    // 1. Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0d14, 0.035);
    
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 0, 9);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isMobile,
      alpha: true,
      powerPreference: "high-performance"
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.25 : 2));
    this.renderer.shadowMap.enabled = !this.isMobile;
    if (!this.isMobile) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // 2. Volumetric Lighting Setup
    this.setupLighting();

    // 3. Build 3D Mario Head, Particles & Environment
    this.marioGroup = new THREE.Group();
    this.scene.add(this.marioGroup);
    
    this.buildMarioHead();
    this.buildEnvironment();
    this.buildStarfieldParticles();

    // 4. Bind GSAP ScrollTrigger & DOM Events
    this.bindEvents();
    this.initScrollTriggers();

    // 5. Start Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupLighting() {
    // Soft Ambient Base
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambientLight);

    // Key Directional Light
    this.mainLight = new THREE.DirectionalLight(0xffffff, 0.95);
    this.mainLight.position.set(6, 8, 7);
    if (!this.isMobile) {
      this.mainLight.castShadow = true;
      this.mainLight.shadow.mapSize.width = 1024;
      this.mainLight.shadow.mapSize.height = 1024;
    }
    this.scene.add(this.mainLight);

    // Electric Rim Light
    const rimLight = new THREE.DirectionalLight(0x0099ff, 0.7);
    rimLight.position.set(-6, -4, -4);
    this.scene.add(rimLight);

    // Warm Gold Ambient Pointlight
    const goldPoint = new THREE.PointLight(0xfbd000, 0.8, 25);
    goldPoint.position.set(2, 4, -3);
    this.scene.add(goldPoint);

    // Neon Crimson Accent Light
    const crimsonPoint = new THREE.PointLight(0xe52521, 0.6, 20);
    crimsonPoint.position.set(-4, -2, 2);
    this.scene.add(crimsonPoint);
  }

  /* ------------------------------------------------------------------------
     3D Mario Head Assembly & Vertex Physics Setup
     ------------------------------------------------------------------------ */
  buildMarioHead() {
    this.headMeshGroup = new THREE.Group();
    
    // Materials Map
    this.materials = {
      skin: new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.45, metalness: 0.05 }),
      capRed: new THREE.MeshStandardMaterial({ color: 0xe52521, roughness: 0.35, metalness: 0.1 }),
      hairBrown: new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.75 }),
      mustacheBrown: new THREE.MeshStandardMaterial({ color: 0x331c0e, roughness: 0.65 }),
      eyeWhite: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 }),
      irisBlue: new THREE.MeshStandardMaterial({ color: 0x0099ff, roughness: 0.1, metalness: 0.3 }),
      pupilBlack: new THREE.MeshBasicMaterial({ color: 0x000000 }),
      capEmblemWhite: new THREE.MeshBasicMaterial({ color: 0xffffff })
    };

    // A. Main Deformable Face & Cap Mesh
    const faceGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const posAttr = faceGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);
      if (y < -0.2 && z > 0) {
        posAttr.setY(i, y * 1.15); // Extended chin
      }
    }
    faceGeo.computeVertexNormals();

    this.faceMesh = new THREE.Mesh(faceGeo, this.materials.skin);
    this.faceMesh.castShadow = !this.isMobile;
    this.faceMesh.receiveShadow = !this.isMobile;
    this.headMeshGroup.add(this.faceMesh);

    // Resting vertices & spring velocities
    this.vertexCount = posAttr.count;
    this.initialPositions = posAttr.array.slice();
    this.currentVelocities = new Float32Array(this.vertexCount * 3);

    // B. Bulbous Nose
    const noseGeo = new THREE.SphereGeometry(0.52, 24, 24);
    noseGeo.scale(1.1, 0.95, 1.0);
    this.noseMesh = new THREE.Mesh(noseGeo, this.materials.skin);
    this.noseMesh.position.set(0, -0.05, 1.55);
    this.headMeshGroup.add(this.noseMesh);

    // C. Cap Dome & Visor
    const capDomeGeo = new THREE.SphereGeometry(1.68, 28, 28, 0, Math.PI * 2, 0, Math.PI * 0.52);
    this.capDome = new THREE.Mesh(capDomeGeo, this.materials.capRed);
    this.capDome.position.set(0, 0.2, -0.05);
    this.headMeshGroup.add(this.capDome);

    const visorGeo = new THREE.CylinderGeometry(1.6, 1.75, 0.12, 24, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
    this.visor = new THREE.Mesh(visorGeo, this.materials.capRed);
    this.visor.position.set(0, 0.65, 0.85);
    this.visor.rotation.x = 0.25;
    this.headMeshGroup.add(this.visor);

    // Cap 'M' Badge Logo
    const mCanvas = document.createElement('canvas');
    mCanvas.width = 256;
    mCanvas.height = 256;
    const ctx = mCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(128, 128, 120, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e52521';
    ctx.font = '900 150px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', 128, 134);

    const mTexture = new THREE.CanvasTexture(mCanvas);
    const mBadgeGeo = new THREE.PlaneGeometry(0.68, 0.68);
    const mBadgeMat = new THREE.MeshBasicMaterial({ map: mTexture, transparent: true });
    const mBadge = new THREE.Mesh(mBadgeGeo, mBadgeMat);
    mBadge.position.set(0, 1.15, 1.33);
    mBadge.rotation.x = -0.3;
    this.headMeshGroup.add(mBadge);

    // D. Mario Eyes & Pupils
    this.leftEyeGroup = this.createEyeGroup(-1);
    this.rightEyeGroup = this.createEyeGroup(1);
    this.headMeshGroup.add(this.leftEyeGroup);
    this.headMeshGroup.add(this.rightEyeGroup);

    // E. Iconic Mustache
    const mustacheGroup = new THREE.Group();
    const bumpGeo = new THREE.SphereGeometry(0.28, 16, 16);
    bumpGeo.scale(1.2, 0.7, 0.6);

    for (let i = -2; i <= 2; i++) {
      const bump = new THREE.Mesh(bumpGeo, this.materials.mustacheBrown);
      bump.position.set(i * 0.28, -0.42 + Math.abs(i) * 0.04, 1.4 - Math.abs(i) * 0.08);
      bump.rotation.z = -i * 0.12;
      mustacheGroup.add(bump);
    }
    this.headMeshGroup.add(mustacheGroup);

    // F. Eyebrows
    const eyebrowGeo = new THREE.BoxGeometry(0.55, 0.12, 0.12);
    const leftBrow = new THREE.Mesh(eyebrowGeo, this.materials.mustacheBrown);
    leftBrow.position.set(-0.55, 0.62, 1.38);
    leftBrow.rotation.z = -0.15;
    leftBrow.rotation.y = 0.2;
    this.headMeshGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(eyebrowGeo, this.materials.mustacheBrown);
    rightBrow.position.set(0.55, 0.62, 1.38);
    rightBrow.rotation.z = 0.15;
    rightBrow.rotation.y = -0.2;
    this.headMeshGroup.add(rightBrow);

    // G. Ears
    const earGeo = new THREE.SphereGeometry(0.35, 16, 16);
    earGeo.scale(0.5, 1.1, 0.8);
    const leftEar = new THREE.Mesh(earGeo, this.materials.skin);
    leftEar.position.set(-1.6, 0.1, 0.1);
    leftEar.rotation.y = -0.4;
    this.headMeshGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, this.materials.skin);
    rightEar.position.set(1.6, 0.1, 0.1);
    rightEar.rotation.y = 0.4;
    this.headMeshGroup.add(rightEar);

    this.marioGroup.add(this.headMeshGroup);
  }

  createEyeGroup(side) {
    const eyeGroup = new THREE.Group();
    eyeGroup.position.set(side * 0.52, 0.32, 1.32);

    const eyeWhiteGeo = new THREE.SphereGeometry(0.32, 20, 20);
    eyeWhiteGeo.scale(0.85, 1.1, 0.7);
    const eyeball = new THREE.Mesh(eyeWhiteGeo, this.materials.eyeWhite);
    eyeGroup.add(eyeball);

    const pupilGroup = new THREE.Group();
    pupilGroup.position.set(0, 0, 0.22);

    const irisGeo = new THREE.CircleGeometry(0.15, 16);
    const iris = new THREE.Mesh(irisGeo, this.materials.irisBlue);
    pupilGroup.add(iris);

    const pupilGeo = new THREE.CircleGeometry(0.08, 16);
    const pupil = new THREE.Mesh(pupilGeo, this.materials.pupilBlack);
    pupil.position.z = 0.01;
    pupilGroup.add(pupil);

    const shineGeo = new THREE.CircleGeometry(0.03, 8);
    const shine = new THREE.Mesh(shineGeo, this.materials.capEmblemWhite);
    shine.position.set(0.05, 0.05, 0.02);
    pupilGroup.add(shine);

    eyeGroup.add(pupilGroup);
    eyeGroup.pupilGroup = pupilGroup;

    return eyeGroup;
  }

  /* ------------------------------------------------------------------------
     Floating 3D Environment & Floating Artifacts
     ------------------------------------------------------------------------ */
  buildEnvironment() {
    this.envGroup = new THREE.Group();
    this.scene.add(this.envGroup);

    // 1. Super Star
    const starShape = new THREE.Shape();
    const points = 5;
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? 0.75 : 0.34;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: 0.22, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.08, bevelThickness: 0.08 });
    starGeo.center();
    const starMat = new THREE.MeshStandardMaterial({ color: 0xfbd000, roughness: 0.25, metalness: 0.6 });
    this.starMesh = new THREE.Mesh(starGeo, starMat);
    this.starMesh.position.set(-3.5, 2.4, -1);
    this.envGroup.add(this.starMesh);

    // 2. Floating 3D Mario Coin
    const coinGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.14, 28);
    const coinMat = new THREE.MeshStandardMaterial({ color: 0xfbd000, roughness: 0.15, metalness: 0.85 });
    this.coinMesh = new THREE.Mesh(coinGeo, coinMat);
    this.coinMesh.position.set(3.5, 2.2, -1);
    this.coinMesh.rotation.x = Math.PI / 2;
    this.envGroup.add(this.coinMesh);

    // 3. Question Block
    const blockGeo = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    const blockMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.35, metalness: 0.2 });
    this.qBlockMesh = new THREE.Mesh(blockGeo, blockMat);
    this.qBlockMesh.position.set(3.2, -2.2, -0.5);
    this.envGroup.add(this.qBlockMesh);

    // 4. Secondary Floating Decorative Octahedron Nodes
    this.floatingNodes = [];
    const nodeMat = new THREE.MeshStandardMaterial({ color: 0x0099ff, wireframe: true });
    for (let i = 0; i < (this.isMobile ? 3 : 8); i++) {
      const nodeGeo = new THREE.OctahedronGeometry(0.3 + Math.random() * 0.3);
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.set(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10,
        -2 - Math.random() * 6
      );
      mesh.rotSpeed = (Math.random() - 0.5) * 0.02;
      this.floatingNodes.push(mesh);
      this.envGroup.add(mesh);
    }
  }

  /* ------------------------------------------------------------------------
     Atmospheric 3D Volumetric Starfield / Dust Particles
     ------------------------------------------------------------------------ */
  buildStarfieldParticles() {
    const count = this.isMobile ? 300 : 1000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorPalette = [
      new THREE.Color(0xfbd000), // Gold
      new THREE.Color(0x0099ff), // Blue
      new THREE.Color(0xe52521), // Crimson
      new THREE.Color(0xffffff)  // Pure White
    ];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 2;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.isMobile ? 0.06 : 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    this.starfield = new THREE.Points(geometry, material);
    this.scene.add(this.starfield);
  }

  /* ------------------------------------------------------------------------
     Material Presets (Classic, Metal Mario, Gold, Cyber)
     ------------------------------------------------------------------------ */
  setStyle(style) {
    this.currentStyle = style;
    
    let targetMat = null;

    if (style === 'metal') {
      targetMat = new THREE.MeshStandardMaterial({
        color: 0xdddddd,
        metalness: 0.95,
        roughness: 0.08
      });
    } else if (style === 'gold') {
      targetMat = new THREE.MeshStandardMaterial({
        color: 0xfbd000,
        metalness: 0.92,
        roughness: 0.2
      });
    } else if (style === 'cyber') {
      targetMat = new THREE.MeshStandardMaterial({
        color: 0x00f2fe,
        wireframe: true
      });
    }

    if (targetMat) {
      this.headMeshGroup.traverse((child) => {
        if (child.isMesh && child.material !== this.materials.capEmblemWhite) {
          child.material = targetMat;
        }
      });
    } else {
      // Classic Restore
      this.faceMesh.material = this.materials.skin;
      this.capDome.material = this.materials.capRed;
      this.visor.material = this.materials.capRed;
      this.noseMesh.material = this.materials.skin;

      this.headMeshGroup.traverse((child) => {
        if (child.isMesh) {
          if (child === this.faceMesh || child === this.noseMesh) {
            child.material = this.materials.skin;
          } else if (child === this.capDome || child === this.visor) {
            child.material = this.materials.capRed;
          } else if (child.parent && child.parent.pupilGroup) {
            // Keep eye materials intact
          } else {
            child.material = this.materials.mustacheBrown;
          }
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     GSAP ScrollTrigger Cinematic 3D Trajectory Integration
     ------------------------------------------------------------------------ */
  initScrollTriggers() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Create continuous timeline mapping scroll to 3D camera & Mario positions
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2
      }
    });

    // Responsive 3D Camera & Mario Trajectories
    if (this.isMobile) {
      tl.to(this.targetCamPos, { x: 0, y: -0.6, z: 10.2, duration: 1 })
        .to(this.marioTargetPos, { x: 0, y: 1.0, z: -1.5, duration: 1 }, 0)
        .to(this.targetCamPos, { x: 0, y: -1.2, z: 10.8, duration: 1 })
        .to(this.marioTargetPos, { x: 0, y: 0.8, z: -1.2, duration: 1 }, 1)
        .to(this.targetCamPos, { x: 0, y: -1.8, z: 11.0, duration: 1 })
        .to(this.marioTargetPos, { x: 0, y: 0.6, z: -1.5, duration: 1 }, 2)
        .to(this.targetCamPos, { x: 0, y: -2.2, z: 10.5, duration: 1 })
        .to(this.marioTargetPos, { x: 0, y: 0.8, z: -1.0, duration: 1 }, 3)
        .to(this.targetCamPos, { x: 0, y: -0.5, z: 9.8, duration: 1 })
        .to(this.marioTargetPos, { x: 0, y: 0.5, z: -0.8, duration: 1 }, 4);
    } else {
      // Desktop Cinematic Wide Trajectory
      tl.to(this.targetCamPos, { x: 1.2, y: -0.6, z: 8.2, duration: 1 })
        .to(this.marioTargetPos, { x: -1.8, y: 0.4, z: 0.5, duration: 1 }, 0)
        .to(this.targetCamPos, { x: -1.5, y: -1.2, z: 8.8, duration: 1 })
        .to(this.marioTargetPos, { x: 2.2, y: -0.2, z: 0.8, duration: 1 }, 1)
        .to(this.targetCamPos, { x: 0, y: -1.8, z: 9.2, duration: 1 })
        .to(this.marioTargetPos, { x: -2.4, y: -0.8, z: 0.2, duration: 1 }, 2)
        .to(this.targetCamPos, { x: 1.6, y: -2.2, z: 8.5, duration: 1 })
        .to(this.marioTargetPos, { x: 2.5, y: 0.6, z: 1.0, duration: 1 }, 3)
        .to(this.targetCamPos, { x: 0, y: -0.5, z: 7.8, duration: 1 })
        .to(this.marioTargetPos, { x: 0, y: 0.3, z: 1.2, duration: 1 }, 4);
    }
  }

  /* ------------------------------------------------------------------------
     Super Mario 64 Vertex Drag & Spring Physics Solver
     ------------------------------------------------------------------------ */
  onPointerDown(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / this.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / this.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([this.faceMesh, this.noseMesh, this.capDome]);

    if (intersects.length > 0) {
      this.isDragging = true;
      const hit = intersects[0];
      this.dragStartPoint.copy(hit.point);

      this.dragPlane.setFromNormalAndCoplanarPoint(
        this.camera.getWorldDirection(new THREE.Vector3()).negate(),
        hit.point
      );

      const posAttr = this.faceMesh.geometry.attributes.position;
      const localHitPoint = this.faceMesh.worldToLocal(hit.point.clone());

      this.draggedVertexIndices = [];
      this.dragWeights = [];

      for (let i = 0; i < posAttr.count; i++) {
        const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        const dist = v.distanceTo(localHitPoint);

        if (dist < this.deformRadius) {
          this.draggedVertexIndices.push(i);
          const w = Math.exp(-(dist * dist) / (2 * 0.4 * 0.4));
          this.dragWeights.push(w);
        }
      }

      if (window.soundEngine) window.soundEngine.playBoing(1.2);
    }
  }

  onPointerMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / this.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / this.height) * 2 + 1;

    // Smooth head look rotation & mouse parallax
    this.targetRotation.x = this.mouse.y * 0.45;
    this.targetRotation.y = this.mouse.x * 0.65;
    this.parallaxOffset.x = this.mouse.x * 0.5;
    this.parallaxOffset.y = this.mouse.y * 0.3;

    // Vertex drag solver
    if (this.isDragging && this.draggedVertexIndices.length > 0) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const currentDragPoint = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.dragPlane, currentDragPoint);

      if (currentDragPoint) {
        const dragDeltaWorld = currentDragPoint.sub(this.dragStartPoint);
        const dragDeltaLocal = dragDeltaWorld.clone().applyQuaternion(this.faceMesh.quaternion.clone().invert());
        
        const posAttr = this.faceMesh.geometry.attributes.position;

        for (let k = 0; k < this.draggedVertexIndices.length; k++) {
          const idx = this.draggedVertexIndices[k];
          const w = this.dragWeights[k];

          const origX = this.initialPositions[idx * 3];
          const origY = this.initialPositions[idx * 3 + 1];
          const origZ = this.initialPositions[idx * 3 + 2];

          posAttr.setXYZ(
            idx,
            origX + dragDeltaLocal.x * w * 1.5,
            origY + dragDeltaLocal.y * w * 1.5,
            origZ + dragDeltaLocal.z * w * 1.5
          );
        }
        posAttr.needsUpdate = true;
      }
    }
  }

  onPointerUp() {
    if (this.isDragging) {
      this.isDragging = false;
      if (window.soundEngine) window.soundEngine.playBoing(0.8);
    }
  }

  resetFace() {
    const posAttr = this.faceMesh.geometry.attributes.position;
    for (let i = 0; i < this.vertexCount * 3; i++) {
      posAttr.array[i] = this.initialPositions[i];
      this.currentVelocities[i] = 0;
    }
    posAttr.needsUpdate = true;
    if (window.soundEngine) window.soundEngine.playBoing(1.5);
  }

  /* ------------------------------------------------------------------------
     Main Animation Loop
     ------------------------------------------------------------------------ */
  animate() {
    requestAnimationFrame(this.animate);

    // 1. Lerp Camera Position & Position Parallax
    this.currentCamPos.x += (this.targetCamPos.x + this.parallaxOffset.x - this.currentCamPos.x) * 0.05;
    this.currentCamPos.y += (this.targetCamPos.y + this.parallaxOffset.y - this.currentCamPos.y) * 0.05;
    this.currentCamPos.z += (this.targetCamPos.z - this.currentCamPos.z) * 0.05;
    this.camera.position.copy(this.currentCamPos);

    // 2. Lerp Mario Position
    this.marioCurrentPos.x += (this.marioTargetPos.x - this.marioCurrentPos.x) * 0.06;
    this.marioCurrentPos.y += (this.marioTargetPos.y - this.marioCurrentPos.y) * 0.06;
    this.marioCurrentPos.z += (this.marioTargetPos.z - this.marioCurrentPos.z) * 0.06;
    this.marioGroup.position.copy(this.marioCurrentPos);

    // 3. Head & Eye Tracking
    this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
    this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

    this.headMeshGroup.rotation.x = this.currentRotation.x;
    this.headMeshGroup.rotation.y = this.currentRotation.y;

    const pupilOffsetX = Math.max(-0.08, Math.min(0.08, this.mouse.x * 0.1));
    const pupilOffsetY = Math.max(-0.08, Math.min(0.08, this.mouse.y * 0.1));
    if (this.leftEyeGroup && this.leftEyeGroup.pupilGroup) {
      this.leftEyeGroup.pupilGroup.position.x = pupilOffsetX;
      this.leftEyeGroup.pupilGroup.position.y = pupilOffsetY;
    }
    if (this.rightEyeGroup && this.rightEyeGroup.pupilGroup) {
      this.rightEyeGroup.pupilGroup.position.x = pupilOffsetX;
      this.rightEyeGroup.pupilGroup.position.y = pupilOffsetY;
    }

    // 4. Elastic Spring Face Rebound Physics
    if (!this.isDragging) {
      const posAttr = this.faceMesh.geometry.attributes.position;
      let needsUpdate = false;

      for (let i = 0; i < this.vertexCount; i++) {
        const idx3 = i * 3;
        
        for (let axis = 0; axis < 3; axis++) {
          const curr = posAttr.array[idx3 + axis];
          const rest = this.initialPositions[idx3 + axis];
          const dist = curr - rest;

          if (Math.abs(dist) > 0.001 || Math.abs(this.currentVelocities[idx3 + axis]) > 0.001) {
            const force = -dist * this.stiffness;
            this.currentVelocities[idx3 + axis] = (this.currentVelocities[idx3 + axis] + force) * this.damping;
            posAttr.array[idx3 + axis] += this.currentVelocities[idx3 + axis];
            needsUpdate = true;
          } else {
            posAttr.array[idx3 + axis] = rest;
            this.currentVelocities[idx3 + axis] = 0;
          }
        }
      }

      if (needsUpdate) {
        posAttr.needsUpdate = true;
      }
    }

    // 5. Environmental Motion
    const time = Date.now() * 0.002;
    if (this.starMesh) {
      this.starMesh.rotation.y += 0.025;
      this.starMesh.position.y = 2.4 + Math.sin(time) * 0.18;
    }
    if (this.coinMesh) {
      this.coinMesh.rotation.z += 0.035;
      this.coinMesh.position.y = 2.2 + Math.cos(time) * 0.15;
    }
    if (this.qBlockMesh) {
      this.qBlockMesh.rotation.y += 0.018;
      this.qBlockMesh.position.y = -2.2 + Math.sin(time * 0.8) * 0.12;
    }

    if (this.floatingNodes) {
      this.floatingNodes.forEach(node => {
        node.rotation.x += node.rotSpeed;
        node.rotation.y += node.rotSpeed;
      });
    }

    if (this.starfield) {
      this.starfield.rotation.y = time * 0.02;
      this.starfield.rotation.x = Math.sin(time * 0.01) * 0.05;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onViewModeChanged(isPhone) {
    this.isMobile = isPhone;
    const targetX = this.isMobile ? 0 : 2.0;
    const targetY = this.isMobile ? 1.4 : 0.1;
    const targetZ = this.isMobile ? -1.2 : 0.2;
    this.marioTargetPos.set(targetX, targetY, targetZ);
    this.targetCamPos.z = this.isMobile ? 10.5 : 9;
  }

  bindEvents() {
    const onResize = () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.isMobile = this.width < 768 || document.body.classList.contains('forced-phone-mode');
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.25 : 2));

      const targetX = this.isMobile ? 0 : 2.0;
      const targetY = this.isMobile ? 1.4 : 0.1;
      const targetZ = this.isMobile ? -1.2 : 0.2;
      this.marioTargetPos.set(targetX, targetY, targetZ);
      this.targetCamPos.z = this.isMobile ? 10.5 : 9;
    };
    window.addEventListener('resize', onResize);

    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointermove', (e) => this.onPointerMove(e));
    window.addEventListener('pointerup', () => this.onPointerUp());
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  window.mario3D = new Mario3DEngine('mario-canvas');
});
