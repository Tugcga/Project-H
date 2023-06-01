import { PathFinderTile, PathFinderOptions } from "./options";
import { Point } from "./point";

class PathFinderNode{
    private m_position: Point;
    private m_g: i32;
    private m_h: i32;
    private m_parent_node_position: Point;
    private m_f: i32;
    private m_closed: u8;  // 0 - undefined, 1 - open, 2 - closed

    constructor(position: Point, g: i32, h: i32, parent_node_position: Point){
        this.m_position = position;
        this.m_g = g;
        this.m_h = h;
        this.m_parent_node_position = parent_node_position;
        this.m_f = -1;
        this.m_closed = 0;
    }

    @inline
    f(): i32{
        return this.m_f;
    }

    @inline
    g(): i32{
        return this.m_g;
    }

    @inline
    position(): Point{
        return this.m_position;
    }

    @inline
    parent_node_position(): Point{
        return this.m_parent_node_position;
    }

    reset(): void{
        this.m_g = 0;
        this.m_h = 0;
        this.m_parent_node_position = new Point();
        this.m_f = -1;
        this.m_closed = 0;
    }

    update(g: i32, h: i32, parent: Point): void{
        if(this.m_f == -1 || this.m_f > g + h){
            this.m_g = g;
            this.m_h = h;
            this.m_f = g + h;
            this.m_parent_node_position = parent;
        }
    }

    @inline
    close(): void{
        this.m_closed = 2;
    }

    @inline
    open(): void{
        this.m_closed = 1;
    }

    is_closed(): bool{
        if(this.m_closed != 0){
            return this.m_closed == 2;
        }
        else{
            return false;
        }
    }

    is_undefined(): bool{
        if(this.m_closed != 0){
            return false;
        }
        else{
            return true;
        }
    }

    toString(): string{
        return "<" + this.m_position.toString() + ":" + this.m_g.toString() + ":" + this.m_h.toString() + ":" + this.m_parent_node_position.toString() + ":" + this.m_closed.toString() + ">";
    }
}

function distance(start: Point, end: Point): i32 {
    return abs(start.x() - end.x()) + abs(start.y() - end.y());
}

function node_comparator(a: PathFinderNode, b: PathFinderNode): bool{
    return a.f() > b.f();
}

class PathFinderGraph{
    private m_height:i32;
    private m_width: i32;
    private m_internal_grid: StaticArray<StaticArray<PathFinderNode>>;
    private m_open: StaticArray<PathFinderNode>;
    private m_open_length: i32;

    constructor(height: i32, width: i32){
        this.m_height = height;
        this.m_width = width;
        const loca_grid = new StaticArray<StaticArray<PathFinderNode>>(height)
        this.m_internal_grid = loca_grid;
        for(let x = 0, x_len = height; x < x_len; x++){
            let x_array: StaticArray<PathFinderNode> = new StaticArray<PathFinderNode>(width);
            for(let y = 0, y_len = width; y < y_len; y++){
                x_array[y] = new PathFinderNode(new Point(x, y), 0, 0, new Point());
            }
            loca_grid[x] = x_array;
        }
        this.m_open = new StaticArray<PathFinderNode>(width);
        this.m_open_length = 0;
    }

    @inline
    get_node_from_grid(x: i32, y: i32): PathFinderNode{
        return this.m_internal_grid[x][y];
    }

    reset(): void{
        for(let i = 0; i < this.m_height; i++){
            for(let j = 0; j < this.m_width; j++){
                let n = this.m_internal_grid[i][j];
                n.reset();
            }
        }

        this.m_open_length = 0;
    }

    private _append_to_open(node: PathFinderNode): void{
        if(this.m_open_length == this.m_open.length){
            let new_open = new StaticArray<PathFinderNode>(this.m_open_length + this.m_width);
            for(let i = 0; i < this.m_open_length; i++){
                new_open[i] = this.m_open[i];
            }
            this.m_open = new_open;
        }
        this.m_open[this.m_open_length] = node;
        this.m_open_length++;
    }

    open_node(position: Point, g: i32, h: i32, parent: Point): void{
        let node: PathFinderNode = this.m_internal_grid[position.x()][position.y()];
        node.update(g, h, parent);
        node.open();

        this._append_to_open(node);
    }

    @inline
    has_open_nodes(): bool{
        return this.m_open_length > 0;
    }

    get_open_node_with_smallest_f(): PathFinderNode | null{
        if(this.m_open_length > 0){
            let to_return_i: i32 = 0;
            let to_return_f: i32 = this.m_open[0].f();
            for(let i = 0; i < this.m_open_length; i++){
                let node: PathFinderNode = this.m_open[i];
                const node_f: i32 = node.f();
                if(node_f < to_return_f){
                    to_return_i = i;
                    to_return_f = node_f;
                }
            }
            
            let return_node: PathFinderNode = this.m_open[to_return_i];
            for(let i = to_return_i; i < this.m_open_length - 1; i++){
                this.m_open[i] = this.m_open[i + 1];
            }
            this.m_open_length--;
            return_node.close();
            return return_node;
        }
        else{
            return null;
        }
    }

    add_node(x: i32, y: i32, g: i32, target: Point, parent: Point): void{
        let node: PathFinderNode = this.m_internal_grid[x][y];
        const h: i32 = distance(node.position(), target);
        if(!node.is_closed()){
            node.update(g, h, parent);
            if(node.is_undefined()){
                node.open();
                this._append_to_open(node);
            }
        }
    }
}

function order_closed_nodes_as_array(graph: PathFinderGraph, end_node: PathFinderNode): StaticArray<Point>{
    let current_node: PathFinderNode = end_node;
    const length = end_node.g() + 1;
    let to_return = new StaticArray<Point>(length);
    for(let i = 0; i < length; i++){
        to_return[length - i - 1] = current_node.position();
        const pnp = current_node.parent_node_position();
        current_node = graph.get_node_from_grid(pnp.x(), pnp.y());
    }
    return to_return;
}

export class PathFinder{
    private m_world_grid: StaticArray<StaticArray<PathFinderTile>>;
    private m_options: PathFinderOptions;
    private m_height: i32;
    private m_width: i32;
    private m_graph: PathFinderGraph;

    constructor(world_grid: StaticArray<StaticArray<PathFinderTile>>, options: PathFinderOptions){
        this.m_world_grid = world_grid;
        this.m_options = options;
        this.m_height = world_grid.length;
        this.m_width = world_grid[0].length;
        this.m_graph = new PathFinderGraph(world_grid.length, world_grid[0].length);
    }

    @inline
    block_point(point: Point): void{
        this.m_world_grid[point.x()][point.y()] = PathFinderTile.Blocked;
    }

    find_path(start: Point, end: Point): StaticArray<Point>{
        let nodes_visited: i32 = 0;
        this.m_graph.reset();
        this.m_graph.open_node(start, 0, distance(start, end), start);

        while(this.m_graph.has_open_nodes()){
            let q: PathFinderNode | null = this.m_graph.get_open_node_with_smallest_f();
            if(q){
                if(q.position().equal(end)){
                    return order_closed_nodes_as_array(this.m_graph, q);
                }

                if(nodes_visited > this.m_options.search_limit){
                    return new StaticArray<Point>(0);
                }

                const x: i32 = q.position().x();
                const y: i32 = q.position().y();
                const g = q.g() + 1;

                if(this.m_world_grid[x][y - 1] == PathFinderTile.Pathable){
                    this.m_graph.add_node(x, y - 1, g, end, q.position());
                }
                if(this.m_world_grid[x][y + 1] == PathFinderTile.Pathable){
                    this.m_graph.add_node(x, y + 1, g, end, q.position());
                }
                if(this.m_world_grid[x - 1][y] == PathFinderTile.Pathable){
                    this.m_graph.add_node(x - 1, y, g, end, q.position());
                }
                if(this.m_world_grid[x + 1][y] == PathFinderTile.Pathable){
                    this.m_graph.add_node(x + 1, y, g, end, q.position());
                }
            }
            else{
                break;
            }

            nodes_visited += 1;
        }

        return new StaticArray<Point>(0);
    }

    toString(): string{
        let to_return = "";
        for(let x = 0; x < this.m_height; x++){
            let x_str = "";
            for(let y = 0; y < this.m_width; y++){
                x_str += this.m_world_grid[x][y].toString() + " ";
            }
            to_return += x_str + "\n";
        }

        return to_return;
    }
}
