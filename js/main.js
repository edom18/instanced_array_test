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

    var typeSelect = document.getElementById('select-type');
    var numSelect = document.getElementById('select-num');

    typeSelect.addEventListener('change', changeHandler, false);
    numSelect.addEventListener('change', changeHandler, false);

    var initialized = false;
    var renderingType = typeSelect.value;
    var instances = +numSelect.value;

    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.y = 2;
    camera.position.z = 5;
    camera.lookAt(new THREE.Vector3(0, 0, 0));


    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x101010);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    var controls = new THREE.OrbitControls(camera, renderer.domElement);

    if (renderer.extensions.get('ANGLE_instanced_arrays') === false) {
        alert('Don\'t support instanced array extension.');
        return;
    }

    var scene = new THREE.Scene();
    window.scene = scene;

    // var light = new THREE.DirectionalLight(0xffffff);
    // light.position.set(1, 5, -10);
    // scene.add(light);

    var ambient = new THREE.AmbientLight(0xffffff);
    scene.add(ambient);

    var translations = null;
    var orientations = null;

    var originalGeometry = null;
    var originalMaterials = null;

    var baseGeometry = null;
    var igeo = null;

    function changeHandler() {
        renderingType = typeSelect.value;
        instances = +numSelect.value;

        makeObjects(instances, renderingType);
    }

    /**
     * Remove All objects.
     */
    function removeAll() {
        scene.children.forEach(function (child) {
            if (child instanceof THREE.Mesh) {
                scene.remove(child);
            }
        });
    }

    /**
     * Make instance
     *
     * @param {number} count
     */
    function makeInstance(count) {
        var texture = originalMaterials[0].map;
        var material = new THREE.ShaderMaterial({
            vertexShader: vert,
            fragmentShader: frag,
            uniforms: {
                map: { type: 't', value: texture }
            }
        });

        // Instanced geometry
        igeo.maxInstancedCount = void 0; // set undefined

        // per instance data
        translations = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3, 1);

        var vector = new THREE.Vector4();
        for (var i = 0, ul = translations.count; i < ul; i++) {
            var x = Math.random() * 100 - 50;
            var y = Math.random() * 100 - 50;
            var z = Math.random() * 100 - 50;
            vector.set(x, y, z, 0).normalize();
            translations.setXYZ(i, x + vector.x * 5, y + vector.y * 5, z + vector.z * 5);
        }
        igeo.addAttribute('translation', translations); // per mesh translation

        orientations = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4, 1).setDynamic(true);

        // for (var i = 0, ul = orientations.count; i < ul; i++) {
        //     var x = Math.random() * 2 - 1;
        //     var y = Math.random() * 2 - 1;
        //     var z = Math.random() * 2 - 1;
        //     var w = Math.random() * 2 - 1;
        //     vector.set(x, y, z, w).normalize();

        //     orientations.setXYZ(i, vector.x, vector.y, vector.z, vector.w);
        // }
        igeo.addAttribute('orientation', orientations); // per mesh orientaion

        var mesh = new THREE.Mesh(igeo, material);
        scene.add(mesh);
    }

    /**
     * Make normal objects.
     *
     * @param {number} count
     */
    function makeNormalObjects(count) {
        var material = new THREE.MeshFaceMaterial(originalMaterials);
        var mesh = new THREE.Mesh(originalGeometry, material);
        var s = 0.5;
        mesh.scale.set(s, s, s);
        scene.add(mesh);
        for (var i = 0; i < count; i++) {
            var m = mesh.clone();
            var x = Math.random() * 100 - 50;
            var y = Math.random() * 100 - 50;
            var z = Math.random() * 100 - 50;
            m.position.set(x, y, z);
            scene.add(m);
        }
    }

    /**
     * Make objects.
     *
     * @param {number} count
     * @param {string} type
     */
    function makeObjects(count, type) {

        removeAll();

        renderingType = type;
        if (type === 'instance') {
            makeInstance(count);
        }
        else {
            makeNormalObjects(count);
        }
    }


    new THREE.JSONLoader().load('models/table.json', function (geometry, materials) {

        originalGeometry = geometry;
        originalMaterials = materials;

        // Base geometry
        igeo = new THREE.InstancedBufferGeometry().fromGeometry(originalGeometry);

        makeObjects(instances, renderingType);
        // makeObjects(instances, 'normalObject');

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

        renderer.render(scene, camera);
    }

    function update() {

        if (!initialized) {
            return;
        }

        var time = Date.now();

        var delta = (time - lastTime) / 5000;

        if (renderingType === 'instance') {
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

            // for (var i = 0, ul = translations.count; i < ul; i++) {
            //     var index = i * 3;
            //     translations.setXYZ(i, 0, 0, 0);
            // }

            // translations.needsUpdate = true;
            orientations.needsUpdate = true;
        }
        else {
            // scene.children.forEach(function (child, i) {
            //     if (child instanceof THREE.Mesh) {
            //         child.rotation.x += 0.001;
            //         child.rotation.y += 0.001;
            //     }
            // });
        }

        lastTime = time;
    }

    (function loop() {
        requestAnimationFrame(loop);

        stats.begin();

        update();
        render();

        stats.end();
    }());

    document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(renderer.domElement);
    }, false);

}());
