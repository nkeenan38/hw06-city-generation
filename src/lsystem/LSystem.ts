import {vec2, vec3, vec4, mat2, mat3, mat4} from 'gl-matrix';
import Turtle, {RoadType} from './Turtle';
import ExpansionRule from './ExpansionRule';
import DrawingRule from './DrawingRule';
import {Action} from './DrawingRule';
import Terrain from '../Terrain';
import Population from '../Population';
import RoadSegment from './RoadSegment';
import Intersection from './Intersection';
import PopulationCenter from './PopulationCenter';

import {radians, degrees, angleBetweenLinesInRad} from '../globals';

const HIGHWAY_LENGTH : number = .1;
const ROAD_LENGTH : number = .05;
const RADIUS: number = 0.1;

class LSystem 
{
	axiom: string;
	instance: Turtle;
	turtles: Turtle[];
	expansionRules: Map<string, ExpansionRule>;
	drawingRules: Map<string, DrawingRule>;
	terrain: Terrain;
	highways: RoadSegment[] = [];
	roads: RoadSegment[] = [];
	intersections: Intersection[] = [];
	populationCenters: PopulationCenter[] = [];
	transformations: mat3[] = [];
	populationThreshold: number = 0;

	roadLengthEW = ROAD_LENGTH * 4;
	roadLEngthNS = ROAD_LENGTH;

	constructor(populationThreshold: number = 0, seaLevel: number = 0.5)
	{
		this.instance = new Turtle();
		this.terrain = new Terrain(seaLevel);
		this.instance.position = vec2.fromValues(0.0,0.0);
		this.turtles = [this.instance];
		this.populationThreshold = populationThreshold;
	}

	private setup()
	{
		// find population centers
		let threshold = 0.65;
		for (let i = -1+RADIUS; i <= 1-RADIUS; i += RADIUS)
		{
			for (let j = -1+RADIUS; j <= 1-RADIUS; j += RADIUS)
			{
				if (this.terrain.density(vec2.fromValues(i, j)) > threshold)
				{
					let range = 0.25;
					let close = false;
					for (let center of this.populationCenters)
					{
						if (vec2.length(vec2.fromValues(center.position[0]-i, center.position[1]-j)) < range)
						{
							close = true;
							break;
						}
					}
					if (!close) this.populationCenters.push(new PopulationCenter(vec2.fromValues(i, j)));
				}
			}
		}
		if (this.populationCenters.length > 0)
		{
			this.instance.position = this.populationCenters[0].position;
			this.populationCenters[0].visited = true;
			this.instance.roadType = RoadType.Highway;
		}
		else
		{
			this.instance.position = vec2.fromValues(0.0, 0.0);
			this.instance.roadType = RoadType.Road;
		}
		// add intersections
		for (let i = -1; i <= 1; i += this.roadLengthEW)
		{
			for (let j = -1; j <= 1; j += this.roadLEngthNS)
			{
				this.intersections.push(new Intersection(vec2.fromValues(i, j)));
			}
		}
	}

	// expands the initial axiom the specified number of iterations
	expand()
	{
		this.setup();
		// decide what to build
		if (this.instance.roadType == RoadType.Highway)		// if highway
		{
			// connect centers with highway
			for (let i = 0; i < this.populationCenters.length; i++)
			{
				let center: PopulationCenter;
				let minLength = 3;
				for (let c of this.populationCenters)
				{
					if (c.visited) continue;
					let diff: vec2 = vec2.create();
					vec2.subtract(diff, this.instance.position, c.position);
					let len = vec2.length(diff);
					if (len < minLength)
					{
						minLength = len;
						center = c;
					}
				}
				if (center == null)
				{
					center = this.populationCenters[0];
				}
				center.visited = true;
				// rotate towards this point
				let dir: vec2 = vec2.create();
				vec2.subtract(dir, center.position, this.instance.position);
				if (vec2.equals(dir, vec2.create())) continue; // direction is the zero vector
				vec2.normalize(dir, dir);
				let angle: number = degrees(angleBetweenLinesInRad(vec2.create(), this.instance.orientation, vec2.create(), dir));
				this.instance.rotate(angle);
				// draw highway segments towards this center until reached
				let diff: vec2 = vec2.create();
				vec2.subtract(diff, this.instance.position, center.position);
				let distance: number = vec2.length(diff);
				// add initial road segment
				this.transformations.push(this.instance.transformation());
				this.instance.delay = 5;
				while (distance > RADIUS) 
				{
					let road = new RoadSegment();
					road.start = vec2.clone(this.instance.position);
					this.instance.translate(HIGHWAY_LENGTH);
					road.end = vec2.clone(this.instance.position);
					this.transformations.push(this.instance.transformation());
					this.highways.push(road);

					vec2.subtract(diff, this.instance.position, center.position);
					distance = vec2.length(diff);
					this.instance.delay--;
				}
				this.instance.translate(HIGHWAY_LENGTH);
			}
		}
		this.connectIntersections();
		return this.transformations;
	}

	connectIntersections()
	{
		let threshold = this.populationThreshold;
		let turtle: Turtle = new Turtle();
		turtle.scale(vec2.fromValues(0.5, 0.5));
		let dir: vec2 = vec2.create();
		for (let intersection of this.intersections)
		{
			turtle.position = intersection.center;
			// check if a North road can be built
			if (this.terrain.density(vec2.clone(intersection.center)) <= threshold)
			{
				continue;
			}
			if (this.terrain.density(vec2.fromValues(intersection.center[0], intersection.center[1] + this.roadLEngthNS / 2)) > threshold)
			{
				intersection.N = true;
				dir = vec2.fromValues(1.0, 0.0);
				let angle: number = degrees(angleBetweenLinesInRad(vec2.create(), turtle.orientation, vec2.create(), dir));
				turtle.rotate(angle);
				this.transformations.push(turtle.transformation());
			}
			// // check if an East road can be built
			if (this.terrain.density(vec2.fromValues(intersection.center[0] + this.roadLengthEW / 2, intersection.center[1])) > threshold)
			{
				intersection.E = true;
				dir = vec2.fromValues(1.0, 0.0);
				let angle: number = degrees(angleBetweenLinesInRad(vec2.create(), turtle.orientation, vec2.create(), dir));
				turtle.rotate(angle);
				this.transformations.push(turtle.transformation());
				if (this.terrain.density(vec2.fromValues(intersection.center[0] + this.roadLengthEW / 2, intersection.center[1])) > threshold)
				{
					let nextRoad = Turtle.clone(turtle);
					nextRoad.translate(ROAD_LENGTH);
					this.transformations.push(nextRoad.transformation());
				}
			}
			// // check if a South road can be built
			if (this.terrain.density(vec2.fromValues(intersection.center[0], intersection.center[1] - this.roadLEngthNS / 2)) > threshold)
			{
				intersection.S = true;
				dir = vec2.fromValues(0.0, -1.0);
				let angle: number = degrees(angleBetweenLinesInRad(vec2.create(), turtle.orientation, vec2.create(), dir));
				turtle.rotate(angle);
				this.transformations.push(turtle.transformation());
			}
			// check if a West road can be built
			if (this.terrain.density(vec2.fromValues(intersection.center[0] - this.roadLengthEW / 2, intersection.center[1])) > threshold)
			{
				intersection.W = true;
				dir = vec2.fromValues(-1.0, 0.0);
				let angle: number = degrees(angleBetweenLinesInRad(vec2.create(), turtle.orientation, vec2.create(), dir));
				turtle.rotate(angle);
				this.transformations.push(turtle.transformation());
				let nextRoad = Turtle.clone(turtle);
				nextRoad.translate(ROAD_LENGTH);
				this.transformations.push(nextRoad.transformation());
			}
		}
	}

	canBuildNE(intersection: Intersection) : boolean
	{
		let north = new RoadSegment();
		north.start = intersection.center;
		vec2.add(north.end, intersection.center, vec2.fromValues(0.0, this.roadLEngthNS));
		let east = new RoadSegment();
		east.start = intersection.center;
		vec2.add(east.end, intersection.center, vec2.fromValues(this.roadLengthEW, 0.0));
		for (let highway of this.highways)
		{
			let [intersects, pos] = RoadSegment.getLineIntersection(highway, north);
			if (intersects) return false;
			[intersects, pos] = RoadSegment.getLineIntersection(highway, east);
			if (intersects) return false;
		}
		return true;
	}

	canBuildNW(intersection: Intersection) : boolean
	{
		let north = new RoadSegment();
		north.start = intersection.center;
		vec2.add(north.end, intersection.center, vec2.fromValues(0.0, this.roadLEngthNS));
		let west = new RoadSegment();
		west.start = intersection.center;
		vec2.add(west.end, intersection.center, vec2.fromValues(-this.roadLengthEW, 0.0));
		for (let highway of this.highways)
		{
			let [intersects, pos] = RoadSegment.getLineIntersection(highway, north);
			if (intersects) return false;
			[intersects, pos] = RoadSegment.getLineIntersection(highway, west);
			if (intersects) return false;
		}
		return true;
	}

	// each initial index is for buiilding type (high, medium, low)
	// each of these have indexes for transformation matrices for eaach prism (rectangular, the pentagon, hexagonal, the octagon)
	getBuildings() : [[mat4[], mat4[], mat4[], mat4[]],[mat4[], mat4[], mat4[], mat4[]],[mat4[], mat4[], mat4[], mat4[]]]
	{
		let transformations : [[mat4[], mat4[], mat4[], mat4[]],[mat4[], mat4[], mat4[], mat4[]],[mat4[], mat4[], mat4[], mat4[]]]
		                    = [[[],[],[],[]],[[],[],[],[]],[[],[],[],[]]]
		let threshold = HIGHWAY_LENGTH / 2;
		for (let intersection of this.intersections)
		{
			if (intersection.N)
			{
				if (intersection.E && this.canBuildNE(intersection) && this.canBuildNW(intersection))
				{
					let rand1 = Math.random() * 0.1;
					let rand2 = Math.random() * 0;
					let center = vec2.fromValues(intersection.center[0] + 0.025 + rand1, intersection.center[1] + 0.025 + rand2);
					let intersects = false;
					for (let highway of this.highways)
					{
						if (vec2.distance(highway.start, center) < 0.05 || vec2.distance(highway.end, center) < 0.05)
						{
							intersects = true;
							break;
						}
					}
					if (intersects) continue;
					let density = this.terrain.density(center);
					if (density > 0.6)
					{
						let [rt, pt, ht, ot] = this.createBuilding(center, density);
						transformations[0][0] = transformations[0][0].concat(rt);
						transformations[0][1] = transformations[0][1].concat(pt);
						transformations[0][2] = transformations[0][2].concat(ht);
						transformations[0][3] = transformations[0][3].concat(ot);
					}
					else if (density > 0.5)
					{
						let [rt, pt, ht, ot] = this.createBuilding(center, density);
						transformations[1][0] = transformations[1][0].concat(rt);
						transformations[1][1] = transformations[1][1].concat(pt);
						transformations[1][2] = transformations[1][2].concat(ht);
						transformations[1][3] = transformations[1][3].concat(ot);
					}
					else
					{
						let [rt, pt, ht, ot] = this.createBuilding(center, density);
						transformations[2][0] = transformations[2][0].concat(rt);
						transformations[2][1] = transformations[2][1].concat(pt);
						transformations[2][2] = transformations[2][2].concat(ht);
						transformations[2][3] = transformations[2][3].concat(ot);
					}
					center = vec2.fromValues(intersection.center[0] + 0.1 + (0.1 * Math.abs(rand1)), intersection.center[1] + 0.025 - rand2);
					intersects = false;
					for (let highway of this.highways)
					{
						if (vec2.distance(highway.start, center) < 0.05 || vec2.distance(highway.end, center) < 0.05)
						{
							intersects = true;
							break;
						}
					}
					if (intersects) continue;
					density = this.terrain.density(center);
					if (density > 0.6)
					{
						let [rt, pt, ht, ot] = this.createBuilding(center, density);
						transformations[0][0] = transformations[0][0].concat(rt);
						transformations[0][1] = transformations[0][1].concat(pt);
						transformations[0][2] = transformations[0][2].concat(ht);
						transformations[0][3] = transformations[0][3].concat(ot);
					}
					else if (density > 0.5)
					{
						let [rt, pt, ht, ot] = this.createBuilding(center, density);
						transformations[1][0] = transformations[1][0].concat(rt);
						transformations[1][1] = transformations[1][1].concat(pt);
						transformations[1][2] = transformations[1][2].concat(ht);
						transformations[1][3] = transformations[1][3].concat(ot);
					}
					else
					{
						let [rt, pt, ht, ot] = this.createBuilding(center, density);
						transformations[2][0] = transformations[2][0].concat(rt);
						transformations[2][1] = transformations[2][1].concat(pt);
						transformations[2][2] = transformations[2][2].concat(ht);
						transformations[2][3] = transformations[2][3].concat(ot);
					}
				}
			}
		}
		return transformations;
	}

	randShape() : number
	{
		let rand = Math.random();
		return (rand < 0.25) ? 0 :
			   (rand < 0.5)  ? 1 :
			   (rand < 0.75) ? 2 : 3;
	}
	

	createBuilding(center: vec2, density: number) : [mat4[], mat4[], mat4[], mat4[]]
	{
		let transformations: [mat4[], mat4[], mat4[], mat4[]] = [[],[],[],[]];
		if (density > 0.6)			// City center, skyscrapers
		{
			let height = density / 10;
			let T = mat4.fromValues(0.06125, 0.0, 0.0, 0.0,
									0.0, 0.06125, 0.0, 0.0,
									0.0, 0.0, 1.0, 0.0,
									center[0], center[1], height * 4, 1.0);
			transformations[this.randShape()].push(T);
			T = mat4.fromValues(0.35, 0.0, 0.0, 0.0,
								0.0, 0.35, 0.0, 0.0,
								0.0, 0.0, 1.0, 0.0,
								center[0], center[1], height * 3, 1.0);
			transformations[this.randShape()].push(T);
			T = mat4.fromValues(0.35, 0.0, 0.0, 0.0,
								0.0, 0.35, 0.0, 0.0,
								0.0, 0.0, 1.0, 0.0,
								center[0], center[1], height * 2, 1.0);
			transformations[this.randShape()].push(T);
			T = mat4.fromValues(0.35, 0.0, 0.0, 0.0,
								0.0, 0.35, 0.0, 0.0,
								0.0, 0.0, 1.0, 0.0,
								center[0], center[1], height, 1.0);
			transformations[this.randShape()].push(T);
			T = mat4.fromValues(0.35, 0.0, 0.0, 0.0,
								0.0, 0.35, 0.0, 0.0,
								0.0, 0.0, 1.0, 0.0,
								center[0], center[1], 0, 1.0);
			transformations[this.randShape()].push(T);
			T = mat4.fromValues(0.65, 0.0, 0.0, 0.0,
								0.0, 0.65, 0.0, 0.0,
								0.0, 0.0, 1.0, 0.0,
								center[0], center[1], height * 2, 1.0);
			transformations[this.randShape()].push(T);
			T = mat4.fromValues(0.65, 0.0, 0.0, 0.0,
								0.0, 0.65, 0.0, 0.0,
								0.0, 0.0, 1.0, 0.0,
								center[0], center[1], height, 1.0);
			transformations[this.randShape()].push(T);
			T = mat4.fromValues(0.65, 0.0, 0.0, 0.0,
								0.0, 0.65, 0.0, 0.0,
								0.0, 0.0, 1.0, 0.0,
								center[0], center[1], 0, 1.0);
			transformations[this.randShape()].push(T);
			let randx = (Math.random() - 0.5) * 0.0125;
			T = mat4.fromValues(1.25 + randx * 10, 0.0, 0.0, 0.0,
								0.0, 1.0, 0.0, 0.0,
								0.0, 0.0, 1.0, 0.0,
								center[0] + randx, center[1], height, 1.0);
			let shape = this.randShape();
			transformations[this.randShape()].push(T);
			T = mat4.fromValues(1.9 + Math.abs(randx) * 500, 0.0, 0.0, 0.0,
								0.0, 1.9 , 0.0, 0.0,
								0.0, 0.0, 1.0, 0.0,
								center[0] + randx, center[1], 0.0, 1.0);
			transformations[this.randShape()].push(T);
		}
		else if (density > 0.5)		// longer, buildings, but shorter
		{
			let height = Math.pow(density, 3) * 2;
			let randx = (Math.random() - 0.5) * 0.0125;
			let shape = this.randShape();
			let T = mat4.fromValues(1.0, 0.0, 0.0, 0.0,
								0.0, 2.0, 0.0, 0.0,
								0.0, 0.0, height, 0.0,
								center[0] + randx, center[1], 0.0, 1.0);
			transformations[shape].push(T);
			T = mat4.fromValues(2.0, 0.0, 0.0, 0.0,
									0.0, 1.0, 0.0, 0.0,
									0.0, 0.0, height, 0.0,
									center[0] - randx, center[1], 0.0, 1.0);
			transformations[this.randShape()].push(T);
		}
		else						// one, to two stories
		{
			let height = density / 5;
			let T = mat4.fromValues(3.0, 0.0, 0.0, 0.0,
									0.0, 1.0, 0.0, 0.0,
									0.0, 0.0, height, 0.0,
									center[0], center[1], 0.0, 1.0);
			transformations[0].push(T);
		}
		return transformations;
	}
};

export default LSystem;