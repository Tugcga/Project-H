import { TileMask, Tile, TilePoint } from "./options"
import { Point } from "./point"

export class GridPattern{
    private m_name: string;
    m_pattern: StaticArray<StaticArray<TileMask>>;
    m_paint_offsets: StaticArray<TilePoint>;

    constructor(name: string, pattern: StaticArray<StaticArray<TileMask>>, paint_offsets: StaticArray<TilePoint>){
        this.m_name = name;
        this.m_pattern = pattern;
        this.m_paint_offsets = paint_offsets;
    }
}

const top_left = new Point(-1, -1);
const top = new Point(-1, 0);
const top_right = new Point(-1, 1);
const left = new Point(0, -1);
const current = new Point(0, 0);
const right = new Point(0, 1);
const bottom_left = new Point(1, -1);
const bottom = new Point(1, 0);
const bottom_right = new Point(1, 1);

export const grid_patterns: StaticArray<GridPattern> = [
    new GridPattern("Top Left Inside Corner", 
                [[TileMask.Open, TileMask.Open, TileMask.Open], 
                [TileMask.Open, TileMask.Block, TileMask.Block], 
                [TileMask.Wild, TileMask.Block, TileMask.Block]],
                [new TilePoint(top_left, Tile.TopLeftInsideCorner), 
                 new TilePoint(top, Tile.TopWall), 
                 new TilePoint(left, Tile.LeftWall)]),
    new GridPattern("Top Right Inside Corner", 
                [[TileMask.Open, TileMask.Open, TileMask.Wild], 
                [TileMask.Block, TileMask.Block, TileMask.Open], 
                [TileMask.Block, TileMask.Block, TileMask.Wild]],
                [new TilePoint(top_right, Tile.TopRightInsideCorner), 
                 new TilePoint(top, Tile.TopWall), 
                 new TilePoint(right, Tile.RightWall)]),
    new GridPattern("Bottom Left Inside Corner", 
                [[TileMask.Open, TileMask.Block, TileMask.Block], 
                [TileMask.Open, TileMask.Block, TileMask.Block], 
                [TileMask.Wild, TileMask.Open, TileMask.Wild]],
                [new TilePoint(bottom_left, Tile.BottomLeftInsideCorner), 
                 new TilePoint(bottom, Tile.BottomWall), 
                 new TilePoint(left, Tile.LeftWall)]),
    new GridPattern("Bottom Right Inside Corner", 
                [[TileMask.Block, TileMask.Block, TileMask.Open], 
                [TileMask.Block, TileMask.Block, TileMask.Open], 
                [TileMask.Wild, TileMask.Open, TileMask.Open]],
                [new TilePoint(bottom_right, Tile.BottomRightInsideCorner), 
                 new TilePoint(bottom, Tile.BottomWall), 
                 new TilePoint(right, Tile.RightWall)]),
    new GridPattern("Top Wall", 
                [[TileMask.Open, TileMask.Open, TileMask.Open], 
                [TileMask.Block, TileMask.Block, TileMask.Block], 
                [TileMask.Block, TileMask.Block, TileMask.Block]],
                [new TilePoint(top, Tile.TopWall)]),
    new GridPattern("Bottom Wall", 
                [[TileMask.Block, TileMask.Block, TileMask.Block], 
                [TileMask.Block, TileMask.Block, TileMask.Block], 
                [TileMask.Open, TileMask.Open, TileMask.Open]],
                [new TilePoint(bottom, Tile.BottomWall)]),
    new GridPattern("Left Wall", 
                [[TileMask.Open, TileMask.Block, TileMask.Block], 
                [TileMask.Open, TileMask.Block, TileMask.Block], 
                [TileMask.Open, TileMask.Block, TileMask.Block]],
                [new TilePoint(left, Tile.LeftWall)]),
    new GridPattern("Right Wall", 
                [[TileMask.Block, TileMask.Block, TileMask.Open], 
                [TileMask.Block, TileMask.Block, TileMask.Open], 
                [TileMask.Block, TileMask.Block, TileMask.Open]],
                [new TilePoint(right, Tile.RightWall)]),
    new GridPattern("Bottom Left Outside Wall", 
                [[TileMask.Block, TileMask.Open, TileMask.Open], 
                [TileMask.Block, TileMask.Block, TileMask.Block], 
                [TileMask.Block, TileMask.Block, TileMask.Block]],
                [new TilePoint(top, Tile.BottomLeftOutsideCorner)]),
    new GridPattern("Bottom Right Outside Wall", 
                [[TileMask.Open, TileMask.Open, TileMask.Block], 
                [TileMask.Block, TileMask.Block, TileMask.Block], 
                [TileMask.Block, TileMask.Block, TileMask.Block]],
                [new TilePoint(top, Tile.BottomRightOutsideCorner)]),
    new GridPattern("Top Right Outside Wall", 
                [[TileMask.Block, TileMask.Block, TileMask.Block], 
                [TileMask.Block, TileMask.Block, TileMask.Block], 
                [TileMask.Open, TileMask.Open, TileMask.Block]],
                [new TilePoint(bottom, Tile.TopRightOutsideCorner)]),
    new GridPattern("Top Left Outside Wall", 
                [[TileMask.Block, TileMask.Block, TileMask.Block], 
                [TileMask.Block, TileMask.Block, TileMask.Block], 
                [TileMask.Block, TileMask.Open, TileMask.Open]],
                [new TilePoint(bottom, Tile.TopLeftOutsideCorner)]),
    new GridPattern("Top Right Inside For Touching", 
                [[TileMask.Block, TileMask.Open, TileMask.Open], 
                [TileMask.Open, TileMask.Block, TileMask.Block], 
                [TileMask.Open, TileMask.Block, TileMask.Block]],
                [new TilePoint(top, Tile.BottomLeftOutsideCorner)]),
    new GridPattern("Bottom Right Inside For Touching", 
                [[TileMask.Block, TileMask.Block, TileMask.Open], 
                [TileMask.Block, TileMask.Block, TileMask.Open], 
                [TileMask.Open, TileMask.Open, TileMask.Block]],
                [new TilePoint(bottom, Tile.TopRightOutsideCorner)])]
