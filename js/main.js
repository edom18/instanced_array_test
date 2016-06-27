(function () {

    'use strict';


    var vert = `
        attribute vec3 translation;
        attribute vec4 orientation;

        varying vec2 vUv;

        void main() {
            vUv = uv;
            vec3 vPosition = position;
            vec3 vcV = cross(orientation.xyz, vPosition);
            vPosition = vcV * (2.0 * orientation.w) + (cross(orientation.xyz, vcV) * 2.0 + vPosition);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(translation + vPosition, 1.0);
        }
    `;

    var frag = `
        precision mediump float;
        uniform sampler2D map;

        varying vec2 vUv;

        void main() {
            // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            gl_FragColor = texture2D(map, vUv);
        }
    `;


    //////////////////////////////////////////////////


    var initialized = false;

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.y = 2;
    camera.position.z = 5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    var controls = new THREE.OrbitControls(camera);

    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x101010);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    window.scene = scene;

    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(5, 10, 10);
    scene.add(light);

    var ambient = new THREE.AmbientLight(0x333333);
    scene.add(ambient);

    var translations = null;
    var orientations = null;

    new THREE.JSONLoader().load('models/table.json', function (geometry, materials) {

        var texture = materials[0].map;
        var material = new THREE.ShaderMaterial({
            vertexShader: vert,
            fragmentShader: frag,
            uniforms: {
                map: { type: 't', value: texture }
            }
        });

        var instances = 200;

        // Base geometry
        var bgeo = new THREE.BufferGeometry().fromGeometry(geometry);

        // Instanced geometry
        var igeo = new THREE.InstancedBufferGeometry();

        var vertices = bgeo.attributes.position.clone();
        igeo.addAttribute('position', vertices);

        // var rawVertices = data.vertices;
        // var vertices = new THREE.BufferAttribute(new Float32Array(rawVertices), 3);
        // geometory.addAttribute('position', vertices);

        var uvs = bgeo.attributes.uv.clone();
        igeo.addAttribute('uv', uvs);

        // var uvs = new THREE.BufferAttribute(new Float32Array(fighterTexcoordArray), 2);
        // geometory.addAttribute('uv', uvs);

        // var rawIndices = data.faces;
        // var indices = new THREE.BufferAttribute(new Uint16Array(rawIndices), 1);
        // geometory.setIndex(indices);

        // per instance data
        translations = new THREE.InstancedBufferAttribute(new Float32Array(instances * 3), 3, 1);

        var vector = new THREE.Vector4();
        for (var i = 0, ul = translations.count; i < ul; i++) {
            var x = Math.random() * 100 - 50;
            var y = Math.random() * 100 - 50;
            var z = Math.random() * 100 - 50;
            vector.set(x, y, z, 0).normalize();
            translations.setXYZ(i, x + vector.x * 5, y + vector.y * 5, z + vector.z * 5);
        }
        igeo.addAttribute('translation', translations); // per mesh translation

        orientations = new THREE.InstancedBufferAttribute(new Float32Array(instances * 4), 4, 1).setDynamic(true);

        for (var i = 0, ul = orientations.count; i < ul; i++) {
            var x = Math.random() * 2 - 1;
            var y = Math.random() * 2 - 1;
            var z = Math.random() * 2 - 1;
            var w = Math.random() * 2 - 1;
            vector.set(x, y, z, w).normalize();

            orientations.setXYZ(i, vector.x, vector.y, vector.z, vector.w);
        }
        igeo.addAttribute('orientation', orientations); // per mesh orientaion

        var mesh = new THREE.Mesh(igeo, material);
        scene.add(mesh);

        if (renderer.extensions.get('ANGLE_instanced_arrays') === false) {
            alert('Don\'t support instanced array extension.');
            return;
        }

        initialized = true;
    });

    var lastTime = 0;
    var moveQ = (new THREE.Quaternion(0.5, 0.5, 0.5, 0.0)).normalize();
    var tmpQ = new THREE.Quaternion();
    var currentQ = new THREE.Quaternion();

    var stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);

    function render() {

        if (!initialized) {
            return;
        }

        stats.begin();

        var time = Date.now();

        // mesh.rotation.y = time * 0.00005;

        renderer.render(scene, camera);

        var delta = (time - lastTime) / 5000;

        tmpQ.set(
            moveQ.x * delta,
            moveQ.y * delta,
            moveQ.z * delta,
            1.0
        ).normalize();

        for (var i = 0, ul = orientations.count; i < ul; i++) {
            var index = i * 4;
            currentQ.set(
                orientations.array[index + 0],
                orientations.array[index + 1],
                orientations.array[index + 2],
                orientations.array[index + 3]
            );
            currentQ.multiply(tmpQ);

            orientations.setXYZW(i, currentQ.x, currentQ.y, currentQ.z, currentQ.w);
        }

        for (var i = 0, ul = translations.count; i < ul; i++) {
            var index = i * 3;
            translations.setXYZ(i, 0, 0, 0);
        }

        // translations.needsUpdate = true;
        orientations.needsUpdate = true;

        lastTime = time;

        stats.end();
    }

    (function loop() {
        requestAnimationFrame(loop);
        render();
    }());

    document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(renderer.domElement);
    }, false);

}());
