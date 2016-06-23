(function () {

    'use strict';

    var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.y = 2;
    camera.position.z = 2;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    var scene = new THREE.Scene();
    window.scene = scene;

    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(5, 10, 10);
    scene.add(light);

    var ambient = new THREE.AmbientLight(0x333333);
    scene.add(ambient);

    var instances = 1000;
    var geometory = new THREE.InstancedBufferGeometry();

    var vertices = new THREE.BufferAttribute(new Float32Array(fighterPosArray), 3);
    geometory.addAttribute('position', vertices);

    var uvs = new THREE.BufferAttribute(new Float32Array(fighterTexcoordArray), 2);
    geometry.addAttribute('uv', uvs);

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

    orientations = new THREE.InstancedBufferAttribute(new Flaot32Array(instances * 4), 4, 1).setDynamic(true);

    for (var i = 0, ul orientations.count; i < ul; i++) {
        var x = Math.random() * 2 - 1;
        var y = Math.random() * 2 - 1;
        var z = Math.random() * 2 - 1;
        var w = Math.random() * 2 - 1;
        vector.set(x, y, z, w).normalize();

        orientations.setXYZ(i, vector.x, vector.y, vector.z, vector.w);
    }

    geometory.addAttribute('orientation', orientations); // per mesh orientaion

    // material
    var texture = new THREE.TextureLoader().load('');

    document.addEventListener('DOMContentLoaded', function () {
        document.body.appendChild(renderer.domElement);
    }, false);

}());
