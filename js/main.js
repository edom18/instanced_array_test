(function () {

    'use strict';

    var initialized = false;

    var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.y = 2;
    camera.position.z = 2;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
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

    var orientations = null;

    var loader = new THREE.JSONLoader();
    loader.load('models/01_dublin_castle.json', function (modelGeo, materials) {

        var instances = 200;
        var geometory = new THREE.InstancedBufferGeometry();

        var vertices = new THREE.BufferAttribute(new Float32Array(fighterPosArray), 3);
        geometory.addAttribute('position', vertices);

        var uvs = new THREE.BufferAttribute(new Float32Array(fighterTexcoordArray), 2);
        geometory.addAttribute('uv', uvs);

        var indices = new THREE.BufferAttribute(new Uint16Array(fighterIndexArray), 1);
        geometory.setIndex(indices);

        // per instance data
        var offsets = new THREE.InstancedBufferAttribute(new Float32Array(instances * 3), 3, 1);

        var vector = new THREE.Vector4();
        for (var i = 0, ul = offsets.count; i < ul; i++) {
            var x = Math.random() * 100 - 50;
            var y = Math.random() * 100 - 50;
            var z = Math.random() * 100 - 50;
            vector.set(x, y, z, 0).normalize();
            offsets.setXYZ(i, x + vector.x * 5, y + vector.y * 5, z + vector.z * 5);
        }

        geometory.addAttribute('offset', offsets); // per mesh translation

        orientations = new THREE.InstancedBufferAttribute(new Float32Array(instances * 4), 4, 1).setDynamic(true);

        for (var i = 0, ul = orientations.count; i < ul; i++) {
            var x = Math.random() * 2 - 1;
            var y = Math.random() * 2 - 1;
            var z = Math.random() * 2 - 1;
            var w = Math.random() * 2 - 1;
            vector.set(x, y, z, w).normalize();

            orientations.setXYZ(i, vector.x, vector.y, vector.z, vector.w);
        }

        geometory.addAttribute('orientation', orientations); // per mesh orientaion

        // material
        var texture = new THREE.TextureLoader().load('img/mapping-check.png');
        texture.anisotropy = renderer.getMaxAnisotropy();

        var material = new THREE.RawShaderMaterial({
            uniforms: {
                map: { type: 't', value: texture }
            },
            vertexShader: document.getElementById('vs').textContent,
            fragmentShader: document.getElementById('fs').textContent,
            transparent: false
        });

        var mesh = new THREE.Mesh(geometory, material);
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
