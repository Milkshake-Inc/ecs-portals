import { useQueries, useState } from '@ecs/core/helpers';
import TickerEngine from '@ecs/core/TickerEngine';
import Transform from '@ecs/plugins/math/Transform';
import RenderSystem from '@ecs/plugins/render/3d/systems/RenderSystem';
import { InputSystem } from '@ecs/plugins/input/systems/InputSystem';
import ThirdPersonCameraSystem from '@ecs/plugins/render/3d/systems/ThirdPersonCameraSystem';
import PhysXPhysicsSystem from '@ecs/plugins/physics/physx/PhysXPhysicsSystem';
import { generateGradientSkybox } from '@ecs/plugins/render/3d/prefabs/GradientSkybox';
import { AmbientLight, Color as ThreeColor, DirectionalLight, PerspectiveCamera } from 'three';
import { LoadGLTF } from '@ecs/plugins/tools/ThreeHelper';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Entity } from 'tick-knock';
import Color from '@ecs/plugins/math/Color';
import { loadMap } from './Map';
import { getCharacter, MovementSystem } from './Character';
import { createPortal, Portal, PortalSystem } from './Portal';

export class Engine extends TickerEngine {
	constructor(map: GLTF) {
		super();

		this.addSystem(new RenderSystem());
		this.addSystem(new PhysXPhysicsSystem({ x: 0, y: -7, z: 0 }));
		this.addSystem(new MovementSystem());
		this.addSystem(new InputSystem());
		this.addSystem(
			new ThirdPersonCameraSystem({
				value: 2,
				min: 1,
				max: 5,
				speed: 1
			})
		);
		this.addSystem(new PortalSystem());

		const light = new Entity();
		light.add(Transform, { x: 3 });
		light.add(new DirectionalLight(new ThreeColor(Color.White), 1));
		light.add(new AmbientLight(new ThreeColor(Color.White), 0.4));

		const camera = new Entity();
		camera.add(Transform);
		camera.add(PerspectiveCamera);

		const character = getCharacter();

		const portalA = createPortal({ x: -1.3, y: 0.45, z: -2 });
		const portalB = createPortal({ x: -8.5, y: 0.45, z: -2 });
		Portal.link(portalA, portalB);

		this.addEntities(...loadMap(map), light, generateGradientSkybox(), camera, character, portalA, portalB);
	}
}

// Preload assets before starting
LoadGLTF('map.glb').then(gltf => {
	new Engine(gltf);
});
