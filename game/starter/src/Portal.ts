import { useQueries, useSingletonQuery } from '@ecs/core/helpers';
import Transform from '@ecs/plugins/math/Transform';
import { Vector } from '@ecs/plugins/math/Vector';
import RenderState from '@ecs/plugins/render/3d/components/RenderState';
import { LinearFilter, Mesh, MeshBasicMaterial, MeshPhongMaterial, NearestFilter, PerspectiveCamera, PlaneGeometry, RGBFormat, WebGLRenderTarget } from 'three';
import { all, Entity, System } from 'tick-knock';
import { Movement } from './Character';

export const createPortal = (pos: Vector) => {
	const entity = new Entity();
	entity.add(Transform, pos);

	const geo = new PlaneGeometry(0.8, 1, 1);
	const renderTarget = new WebGLRenderTarget(window.innerWidth, window.innerWidth, { minFilter: LinearFilter, magFilter: NearestFilter, format: RGBFormat });
	const mat = new MeshBasicMaterial({ color: 0xffffff, map: renderTarget.texture });

	entity.add(new Mesh(geo, mat));
	entity.add(Portal);
	entity.add(renderTarget);

	return entity;
};

export class Portal {
	other: Entity;

	static link(entityA: Entity, entityB: Entity) {
		const portalA = entityA.get(Portal);
		const portalB = entityB.get(Portal);
		if (!portalA || !portalB) {
			throw new Error('both entities must have a portal');
		}

		portalA.other = entityB;
		portalB.other = entityA;
	}
}

export class PortalSystem extends System {
	getRenderState = useSingletonQuery(this, RenderState);

	queries = useQueries(this, {
		mainCam: all(PerspectiveCamera),
		player: all(Transform, Movement),
		portals: all(Portal, WebGLRenderTarget)
	});

	update(deltaTime: number) {
		const renderState = this.getRenderState();
		const renderer = renderState.renderer;
		const mainCam = this.queries.mainCam.first?.get(PerspectiveCamera);
		const player = this.queries.player.first?.get(Transform);

		if (!renderer || !mainCam || !player) return;

		const oldTarget = renderer.getRenderTarget();

		this.queries.portals.forEach(entity => {
			const portal = entity.get(Portal);
			if (portal.other) {
				const pos = entity.get(Transform);
				const otherPos = portal.other.get(Transform);

				// TODO Figure out correct maths
				const dist = pos.position.clone().sub(player.position);
				mainCam.position.set(otherPos.x + dist.x, mainCam.position.y, otherPos.z + dist.z);

				// Render
				const target = entity.get(WebGLRenderTarget);
				renderer.setRenderTarget(target);
				renderer.clear();
				renderer.render(renderState.scene, mainCam);
			}
		});

		renderer.setRenderTarget(oldTarget);
	}
}
