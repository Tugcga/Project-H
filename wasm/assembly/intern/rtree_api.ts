import { RTree } from "../pathfinder/navmesh/rtree/rtree";
import { Polygon, Point, Edge } from "../pathfinder/navmesh/rtree/polygon";
import { Rectangle } from "../pathfinder/navmesh/rtree/rectangle";

export class PolygonsSequence {
    count: u32;
    coordinates: StaticArray<StaticArray<f32>>;
}

export function create_rtree(max_nodes: u32): RTree {
    return new RTree(max_nodes >= 3 ? max_nodes : 3);
}

export function rtree_insert_polygon(tree: RTree, coordinates: Array<f32>): void {
    tree.insert(new Polygon(StaticArray.fromArray<f32>(coordinates)));
}

export function rtree_insert_point(tree: RTree, x: f32, y: f32): void {
    tree.insert(new Point(x, y));
}

export function rtree_insert_edge(tree: RTree, s_x: f32, s_y: f32, e_x: f32, e_y: f32): void {
    tree.insert(new Edge(s_x, s_y, e_x, e_y));
}

export function rtree_search(tree: RTree, corner_x: f32, corner_y: f32, other_x: f32, other_y: f32): PolygonsSequence {
    const rect = new Rectangle(
        Mathf.min(corner_x, other_x),
        Mathf.max(corner_y, other_y),
        Mathf.max(corner_x,other_x),
        Mathf.min(corner_y, other_y));

    const result = tree.range_search(rect);
    const to_return = new StaticArray<StaticArray<f32>>(result.length);
    for (let i = 0, len = result.length; i < len; i++) {
        const polygon = result[i];
        to_return[i] = polygon.coordinates();
    }

    return { 
        count: result.length,
        coordinates: to_return 
    };
}

export function rtree_insert_edges(tree: RTree, coordinates: Float32Array): void {
    const count = coordinates.length / 4;
    for (let i = 0; i < count; i++) {
        tree.insert(new Edge(coordinates[4*i], coordinates[4*i + 1],
            coordinates[4*i + 2], coordinates[4*i + 3]));
    }
}

export function rtree_find_intersection(tree: RTree, start_x: f32, start_y: f32, finish_x: f32, fisnih_y: f32): StaticArray<f32> {
    const edge = new Edge(start_x, start_y, finish_x, fisnih_y);
    return tree.find_intersection(edge);
}