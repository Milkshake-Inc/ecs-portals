import Quaternion from '@ecs/plugins/math/Quaternion';
import Transform from '@ecs/plugins/math/Transform';
import Vector3 from '@ecs/plugins/math/Vector';
import { Material, Mesh, MeshPhongMaterial, MeshStandardMaterial } from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { PhysXTrimesh } from '@ecs/plugins/physics/physx/component/shapes/TrimeshShape';
import { PhysXBody } from '@ecs/plugins/physics/physx/component/PhysXBody';
import { Entity } from 'tick-knock';
import { CollisionFlags } from './CollisionFlags';

const pieceModifiers = {};

export const loadMap = (map: GLTF) => {
	const entities = [];

	map.scene.traverse(node => {
		// Enable shadows etc on all models
		if (node instanceof Mesh && node.material instanceof Material) {
			node.material = new MeshPhongMaterial({
				name: node.material.name,
				color: (node.material as MeshStandardMaterial).color.convertLinearToSRGB(),
				specular: 0
			});

			node.material.flatShading = true;
			node.material.transparent = false;
			node.castShadow = true;
			node.receiveShadow = true;
		}

		// Create entities from course pieces
		if (node.parent == map.scene) {
			const entity = new Entity();

			entity.add(Transform, {
				position: Vector3.From(node.position),
				scale: Vector3.From(node.scale),
				quaternion: Quaternion.From(node.quaternion)
			});

			entity.add(node);
			entity.add(new PhysXTrimesh(), {
				restitution: 0.4,
				staticFriction: 0,
				dynamicFriction: 0,
				collisionId: CollisionFlags.WORLD,
				collisionMask: CollisionFlags.PLAYER
			});
			entity.add(new PhysXBody(), {
				static: true
			});
			entities.push(entity);

			Object.keys(pieceModifiers).forEach(key => {
				if (node.name.toLowerCase().match(key)) pieceModifiers[key](entity, node, entities);
			});
		}
	});

	return entities;
};
