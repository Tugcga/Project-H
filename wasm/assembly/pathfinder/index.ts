import { log_message, Pair, map_to_string, arrays_eq } from "./common/utilities";
import { Navmesh } from "./navmesh/navmesh";
import { NavmeshNode,
    staticarray_navmeshnode_to_bytes, staticarray_navmeshnode_from_bytes  } from "./navmesh/navmesh_node";
import { NavmeshBVH, TrianglesBVH } from "./navmesh/navmesh_bvh";
import { RVOSimulator } from "./rvo/rvo_simulator";
import { Obstacle } from "./rvo/rvo_obstacle";
import { Agent } from "./rvo/rvo_agent";
import { Vector2 } from "./common/vector2";
import { KDTree } from "./rvo/rvo_kd_tree";
import { List } from "./common/list";
import { PathFinder } from "./pathfinder";

import {level_03_vertices, level_03_polygons, level_03_sizes, level_03_points } from "./maps_data";

import { RC_AREA_BORDER } from "./baker/rc_constants";
import { Span, Heightfield } from "./baker/rc_classes";
import { calc_grid_size } from "./baker/rc_calcs"
import { NavmeshBaker } from "./baker/navmesh_baker";

import { Serializable, SD_TYPE, get_type, list_pair_i32_to_bytes, list_pair_i32_from_bytes, 
float32array_to_bytes, float32array_from_bytes,
list_float32array_bytes_length, list_float32array_to_bytes, list_float32array_from_bytes,
staticarray_i32_to_bytes, staticarray_f32_to_bytes, staticarray_bool_to_bytes,
staticarray_i32_from_bytes, staticarray_f32_from_bytes, staticarray_bool_from_bytes,
map_i32_i32_to_bytes, map_i32_i32_from_bytes,
map_i32_staticarray_i32_to_bytes, map_i32_staticarray_i32_from_bytes,
map_i32_staticarray_f32_to_bytes, map_i32_staticarray_f32_from_bytes,
staticarray_staticarray_i32_to_bytes, staticarray_staticarray_i32_from_bytes,
bool_to_bytes, bool_from_bytes } from "./common/binary_io";

import { Graph,
    staticarray_graph_to_bytes, staticarray_graph_from_bytes } from "./navmesh/navmesh_graph";



function main_pathfinder(): void{

    /*let a = new List<f32>();
    for(let i = 0; i < 50; i++){
        a.push(Mathf.random());
    }
    a[48] = 1.0;

    log_message(a[48].toString());*/
    /*let vertices = new StaticArray<f32>(12);
    let polygons = new StaticArray<i32>(4);
    let sizes = new StaticArray<i32>(1);

    vertices[0] = -4.0; vertices[1] = 0.0; vertices[2] = -4.0;
    vertices[3] = 4.0; vertices[4] = 0.0; vertices[5] = -4.0;
    vertices[6] = 4.0; vertices[7] = 0.0; vertices[8] = 4.0;
    vertices[9] = -4.0; vertices[10] = 0.0; vertices[11] = 4.0;

    polygons[0] = 0; polygons[1] = 1; polygons[2] = 2; polygons[3] = 3;
    sizes[0] = 4;

    let navmesh = new Navmesh(vertices, polygons, sizes);
    let path = navmesh.search_path(2.0, 0.0, 2.0, -2.0, 0.0, -2.0);
    log_message(path.toString());*/

    /*let sim = new RVOSimulator(2.0, 5, 1.0, 1.0, 0.5, 5.0);

    var vertices = new StaticArray<Vector2>(4);
    vertices[0] = new Vector2(-1.0, -1.0);
    vertices[1] = new Vector2(1.0, -1.0);
    vertices[2] = new Vector2(1.0, 1.0);
    vertices[3] = new Vector2(-1.0, 1.0);

    sim.add_obstacle(vertices);
    sim.process_obstacles();
    sim.add_agent(2.0, 2.0);
    sim.add_agent(3.5, 3.5);
    //sim.add_agent(2.0, 2.5);
    //sim.add_agent(2.5, 2.0);
    sim.set_agent_pref_velocity(0, -1.0, -1.0);
    sim.set_agent_pref_velocity(1, -1.0, -1.0);
    //sim.set_agent_pref_velocity(2, -1.0, -1.0);
    //sim.set_agent_pref_velocity(3, -1.0, -1.0);
    for(let s = 0; s < 10; s++){
        if(s == 5){
            let to_delete = new StaticArray<i32>(1);
            to_delete[0] = 0;
            sim.delete_agents(to_delete);
        }
        sim.do_step(0.1);
        let v0 = sim.get_agent_position(0);
        //let v1 = sim.get_agent_position(1);
        //let v2 = sim.get_agent_position(2);
        //let v3 = sim.get_agent_position(3);
        //log_message(v0.to_string() + " " + v1.to_string() + " " + v2.to_string() + " " + v3.to_string());
        //log_message(v0.to_string() + " " + v1.to_string());
        log_message(v0.to_string());
    }*/

    /*let vertices = new StaticArray<f32>(24);
    vertices[0] = -3.0; vertices[1] = 0.0; vertices[2] = -3.0;
    vertices[3] = 3.0; vertices[4] = 0.0; vertices[5] = -3.0;
    vertices[6] = 3.0; vertices[7] = 0.0; vertices[8] = 3.0;
    vertices[9] = -3.0; vertices[10] = 0.0; vertices[11] = 3.0;

    vertices[12] = -1.0; vertices[13] = 2.0; vertices[14] = -1.0;
    vertices[15] = 1.0; vertices[16] = 2.0; vertices[17] = -1.0;
    vertices[18] = 1.0; vertices[19] = 2.0; vertices[20] = 1.0;
    vertices[21] = -1.0; vertices[22] = 2.0; vertices[23] = 1.0;

    let polygons = new StaticArray<i32>(16);
    polygons[0] = 0; polygons[1] = 4; polygons[2] = 5; polygons[3] = 1;
    polygons[4] = 1; polygons[5] = 5; polygons[6] = 6; polygons[7] = 2;
    polygons[8] = 2; polygons[9] = 6; polygons[10] = 7; polygons[11] = 3;
    polygons[12] = 3; polygons[13] = 7; polygons[14] = 4; polygons[15] = 0;

    let sizes = new StaticArray<i32>(4);
    sizes[0] = 4; sizes[1] = 4; sizes[2] = 4; sizes[3] = 4;
    let pathfinder = new PathFinder(vertices, polygons, sizes, 1.0, 1, 0.1, 0.1, 0.5, 5.0, false, true, false, false);

    const a0 = pathfinder.add_agent(0.0, 0.0, 2.0, 0.4, 1.0);
    //const a1 = pathfinder.add_agent(-2.0, 0.0, 1.0, 0.5, 1.0);
    //const a2 = pathfinder.add_agent(2.0, 0.0, 0.0, 0.5, 1.0);
    //const a3 = pathfinder.add_agent(-2.0, 0.0, 0.0, 0.5, 1.0);
    //const a4 = pathfinder.add_agent(-2.0, 0.0, -1.0, 0.5, 1.0);
    pathfinder.set_agent_destination(a0, 0.0, 0.0, -2.0);
    //pathfinder.set_agent_destination(a1, 1.0, 0.0, -2.0);
    //pathfinder.set_agent_destination(a2, -2.0, 0.0, -2.0);
    //pathfinder.set_agent_destination(a3, 2.0, 0.0, 2.0);
    //pathfinder.set_agent_destination(a4, 2.0, 0.0, -2.0);

    for(let step = 0; step < 60; step++){
        pathfinder.update(0.1);
        let poss = pathfinder.get_all_agents_positions();
        let agents = pathfinder.get_agents_id();

        let to_print = step.toString() + ": ";
        for(let i = 0; i < poss.length / 3; i++){
            to_print += agents[i].toString() + ": (" + poss[3*i].toString() + ", " + poss[3*i+1].toString() + ", " + poss[3*i+2].toString() + "), ";
        }
        log_message(to_print);
    }*/

    let vertices = new StaticArray<f32>(level_03_vertices.length)
    for(let i = 0; i < vertices.length; i++){
        vertices[i] = <f32>level_03_vertices[i];
    }

    let polygons = new StaticArray<i32>(level_03_polygons.length)
    for(let i = 0; i < polygons.length; i++){
        polygons[i] = level_03_polygons[i];
    }

    let sizes = new StaticArray<i32>(level_03_sizes.length)
    for(let i = 0; i < sizes.length; i++){
        sizes[i] = level_03_sizes[i];
    }

    let pathfinder = new PathFinder(vertices, polygons, sizes,
        1.5,  // distance to neighborhood agents to avoid it
        5,  // maximum number of agents in the neighborhood
        1.0,  // time in the future to find close agents
         0.01,  // time in the future to detect close obstacles
         0.25,  // default agent radius
         10.5,  // delay between agents path recalculations
         false,  // if true, then all agents continious moving, even it come to destination point
         true,  // move agents
         false,  // snap
         true  // normals
         );
    const agents_count = 0;
    const points_count = level_03_points.length / 3;
    let active_agents_count = 0;
    let agent_positions = new List<i32>();
    let dest_positions = new List<i32>();
    const agent_positions_indexes = [363,450,577,637,153,979,649,412,586,192,612,939,820,23,459,972,14,348,565,419,575,643,20,861,57,787,777,671,995,316,800,956,557,141,924,206,681,74,522,481,928,688,926,750,74,464,344,173,912,689,826,358,589,617,34,772,409,705,735,223,266,69,812,839,367,5,404,766,642,220,236,240,415,971,937,698,142,167,19,856,447,522,596,209,825];
    const agent_dest_indexes = [711,206,22,198,597,764,543,582,683,392,706,679,383,415,467,749,206,122,472,623,649,94,671,852,225,562,603,26,504,381,305,119,207,232,30,624,839,394,995,670,576,303,632,980,302,155,5,677,430,909,91,926,736,223,875,384,413,865,408,754,27,587,223,923,934,785,851,275,243,281,162,841,989,202,615,890,59,250,179,680,871,714,509,665,726];
    const positions = [2.2794809341430666,1.7000000476837159,-0.4205193519592285,3.659374237060547,0.0,1.4646908044815064,1.4117510318756104,0.0,-5.046142578125,-3.8321661949157717,0.050710245966911319,-3.7127041816711427,1.632619857788086,0.9896012544631958,-2.9314725399017336,-5.108954906463623,0.0,1.7782111167907715,-1.8390355110168458,0.0,1.0074607133865357,-3.5429062843322756,0.0,4.7089691162109379,6.57948112487793,0.0,5.319608211517334,0.9158300161361694,0.0,-5.306333065032959,-5.238738059997559,0.0,-2.3205819129943849,0.9050760865211487,0.0,-1.2731260061264039,4.830496788024902,0.0,-4.613938808441162,-1.5429935455322266,0.8802582621574402,3.456209421157837,1.3026715517044068,0.0,-0.9705195426940918,0.5008710622787476,0.2698812782764435,4.362637996673584,3.1913352012634279,0.0006895243423059583,1.288515329360962,-0.5769302248954773,0.2788458466529846,-3.834622621536255,1.8405861854553223,0.0,-4.788682460784912,-1.3927459716796876,0.0,1.8338632583618165,-5.268023490905762,0.02412029728293419,-4.128055572509766,-0.1786608248949051,0.0,-2.566739559173584,-5.06234073638916,0.0,4.580382347106934,-4.5880045890808109,0.0,3.7956387996673586,3.1103923320770265,0.0,-3.5134174823760988,-2.554391622543335,0.021155674010515214,-1.7933863401412964,-1.3410975933074952,0.0,-1.8723292350769044,5.292542457580566,0.0,2.8318049907684328,-6.224634170532227,0.0,-1.1604814529418946,-2.221688985824585,1.4519351720809937,1.6117959022521973,-4.663652420043945,0.0,-1.7475475072860718,0.36812612414360049,0.3369736969470978,3.7773516178131105,2.5065910816192629,0.045511893928050998,2.7860188484191896,-5.075110912322998,0.0,3.6830852031707765,5.050838470458984,0.0,5.195459365844727,-4.025306701660156,0.0,4.577489852905273,-4.809025287628174,0.0,-0.077431820333004,0.26258325576782229,0.0,2.9442410469055177,-5.7366790771484379,0.0,-1.4697322845458985,0.3231227695941925,0.0,-2.336235284805298,-2.813556671142578,1.2972149848937989,2.389228343963623,-4.112175941467285,0.0,3.606294631958008,1.8333944082260132,0.0,1.8407337665557862,4.610379219055176,0.0,0.3714306056499481,-1.3728430271148682,0.0,1.1998891830444337,1.8236868381500245,0.0,-4.286744117736816,-2.520519256591797,1.7000000476837159,0.7454442977905273,-0.45116591453552248,0.0,2.7746405601501467,-1.63118577003479,0.0,-2.3480305671691896,-3.192230463027954,1.5478076934814454,1.5284912586212159,1.4061435461044312,0.0,-4.551474571228027,-2.1054272651672365,1.2059593200683594,2.511216878890991,0.23458325862884522,0.0,-5.087309837341309,-2.0516183376312258,0.08094152063131333,-3.6191182136535646,3.8033015727996828,0.0,3.142706871032715,-5.809630393981934,0.0,3.001267671585083,2.8823583126068117,0.0,-4.955941200256348,2.5021705627441408,0.02292006090283394,1.8457000255584717,-5.885850429534912,0.0,3.5699477195739748,0.2015717774629593,0.0,-1.6355677843093873,-5.455041408538818,0.0057855937629938129,-2.773923873901367,-0.14680708944797517,1.7000000476837159,-0.9215225577354431,-2.00408935546875,0.06529106199741364,-2.901130437850952,-5.474466800689697,0.01810947060585022,-3.3263988494873049,3.9710474014282228,0.0,-2.6643102169036867,-2.6874806880950929,1.572862148284912,1.4102468490600587,5.895241737365723,0.0,5.113760471343994,5.684390068054199,0.0,5.574082374572754,4.506193161010742,0.0,-3.6004810333251955,2.9155466556549074,0.02823629043996334,3.0987396240234377,-3.1116437911987306,1.7000000476837159,0.6415107846260071,5.725696086883545,0.0,-0.06856700778007508,0.1627519726753235,0.0,-2.9342050552368166,-4.292349338531494,0.03832559660077095,-3.362659215927124,-2.8178470134735109,1.4196783304214478,1.9698376655578614,-4.805546760559082,0.0,5.404081344604492,-5.080090522766113,0.02760053053498268,-4.775079250335693,5.072928428649902,0.0,-5.200277328491211,-2.5221900939941408,0.0,4.705611228942871,0.00572630763053894,0.0,2.4724490642547609,-5.436878204345703,0.0,3.3379554748535158,5.292689323425293,0.0,5.954376220703125,1.2972084283828736,1.7000000476837159,-0.36202457547187807,5.4509124755859379,0.0,4.766902923583984,-4.40301513671875,0.04013896360993385,-3.8552229404449465];

    const values = [-2.520519256591797, 1.7000000476837159, 0.7454442977905273, -2.5324387550354006, 1.7000000476837159, 0.6951481699943543];
    //let path = pathfinder.search_path(<f32>values[0], <f32>values[1], <f32>values[2], <f32>values[3], <f32>values[4], <f32>values[5]);
    
    /*for(let i = 0; i < agents_count; i++){
    //for(let i = 0; i < agent_positions_indexes.length; i++){
    //for(let i = 46; i < 0; i++){
        //get random index
        const pi = <i32>(Math.random() * points_count);
        //const pi = agent_positions_indexes[i];
        const a = pathfinder.add_agent(<f32>level_03_points[pi*3],
                                     <f32>level_03_points[pi*3 + 1],
                                     <f32>level_03_points[pi*3 + 2],
                                     0.25, 2.0);
        //const a = pathfinder.add_agent(<f32>positions[i*3],
        //                             <f32>positions[i*3 + 1],
        //                           <f32>positions[i*3 + 2],
        //                           0.25, 2.0);
        const pi_dest = <i32>(Math.random() * points_count);
        //const pi_dest = agent_dest_indexes[i];
        const is_set = pathfinder.set_agent_destination(a, <f32>level_03_points[pi_dest*3],
                                            <f32>level_03_points[pi_dest*3 + 1],
                                            <f32>level_03_points[pi_dest*3 + 2]);
        if(a > -1){
            active_agents_count++;
            agent_positions.push(pi);
            dest_positions.push(pi_dest);
        }
    }*/

    //log_message(agent_positions.toString());
    //log_message(dest_positions.toString());

    pathfinder.add_agent(-0.96, 0.0, -3.027, 0.25, 4.0);
    pathfinder.set_agent_destination(0, 2.8, 1.698, -0.4745);

    for(let step = 0; step < 100; step++){
        pathfinder.update(1.0/30.0);
        let ps = pathfinder.get_all_agents_positions();
        let to_print = step.toString() + ": ";
        for(let i = 0; i < ps.length / 3; i++){
            to_print += "(" + ps[3*i].toString() + ", " + ps[3*i+1].toString() + ", " + ps[3*i+2].toString() + "), ";
        }
        log_message(to_print);

        let acts = pathfinder.get_all_agents_activities();
        if(!acts[0]){
            break;
        }
    }

    /*let vertices = new StaticArray<f32>(12);
    vertices[0] = -3.0; vertices[1] = 0.0; vertices[2] = -3.0;
    vertices[3] = 3.0; vertices[4] = 0.0; vertices[5] = -3.0;
    vertices[6] = 3.0; vertices[7] = 0.0; vertices[8] = 3.0;
    vertices[9] = -3.0; vertices[10] = 0.0; vertices[11] = 3.0;

    let polygons = new StaticArray<i32>(4);
    polygons[0] = 0; polygons[1] = 3; polygons[2] = 2; polygons[3] = 1;

    let sizes = new StaticArray<i32>(1);
    sizes[0] = 4;
    let pathfinder = new PathFinder(vertices, polygons, sizes);

    let navmesh = pathfinder.get_navmesh();
    if(navmesh){
        let sample = navmesh.sample(3.1, 0.0, 1.2);
        log_message(sample.toString());

        let node = navmesh.sample_polygon(sample[0], sample[1], sample[2]);
        if(node){
            log_message(node.toString());
        }
        else{
            log_message("node is null");
        }
    }*/

}

function main_bake(): void{
    let baker = new NavmeshBaker();

    // plane
    let vertices = new StaticArray<f32>(12);
    let polygons = new StaticArray<i32>(4);
    let sizes = new StaticArray<i32>(1);

    vertices[0] = -4.0; vertices[1] = 0.0; vertices[2] = -4.0;
    vertices[3] = -4.0; vertices[4] = 0.0; vertices[5] = 4.0;
    vertices[6] = 4.0; vertices[7] = 0.0; vertices[8] = 4.0;
    vertices[9] = 4.0; vertices[10] = 0.0; vertices[11] = -4.0;

    polygons[0] = 0; polygons[1] = 1; polygons[2] = 2; polygons[3] = 3;
    sizes[0] = 4;

    baker.add_geometry(vertices, polygons, sizes);

    //cube
    vertices = new StaticArray<f32>(24);
    polygons = new StaticArray<i32>(24);
    sizes = new StaticArray<i32>(6);
    vertices[0] = -1.0; vertices[1] = 0.0; vertices[2] = -1.0; 
    vertices[3] = -1.0; vertices[4] = 0.0; vertices[5] = 1.0; 
    vertices[6] = 1.0; vertices[7] = 0.0; vertices[8] = 1.0; 
    vertices[9] = 1.0; vertices[10] = 0.0; vertices[11] = -1.0; 
    vertices[12] = -1.0; vertices[13] = 1.0; vertices[14] = -1.0; 
    vertices[15] = -1.0; vertices[16] = 1.0; vertices[17] = 1.0; 
    vertices[18] = 1.0; vertices[19] = 1.0; vertices[20] = 1.0; 
    vertices[21] = 1.0; vertices[22] = 1.0; vertices[23] = -1.0; 

    polygons[0] = 0; polygons[1] = 3; polygons[2] = 2; polygons[3] = 1;
    polygons[4] = 2; polygons[5] = 6; polygons[6] = 5; polygons[7] = 1;
    polygons[8] = 4; polygons[9] = 5; polygons[10] = 6; polygons[11] = 7;
    polygons[12] = 0; polygons[13] = 4; polygons[14] = 7; polygons[15] = 3;
    polygons[16] = 2; polygons[17] = 3; polygons[18] = 7; polygons[19] = 6;
    polygons[20] = 0; polygons[21] = 1; polygons[22] = 5; polygons[23] = 4;
    sizes[0] = 4; sizes[1] = 4; sizes[2] = 4; sizes[3] = 4; sizes[4] = 4; sizes[5] = 4;
    baker.add_geometry(vertices, polygons, sizes);

    baker.bake(0.3,  // cell_size
               0.2,  // cell_height
               2.0,  // agent_height
               0.6,  // agent_radius
               0.9,  // agent_max_climb
               45.0,  // agent_max_slope
               8,  // region_min_size
               20,  // region_merge_size
               12.0,  // edge_max_len
               1.3,  // edge_max_error
               6,  // verts_per_poly
               6.0,  // detail_sample_distance
               1.0);  // detail_sample_maximum_error

    log_message(baker.get_navmesh_vertices().toString());
    log_message(baker.get_navmesh_polygons().toString());
    log_message(baker.get_navmesh_sizes().toString());
}

function main_sd(): void {
    /*let v = new Vector2(0.5, -1.5);
    let v_bytes = v.to_bytes();
    let u = new Vector2();
    u.from_bytes(v_bytes);
    log_message(u.toString());*/

    /*let v_i32 = new Pair<i32>(2, 3);
    let v_i32_bytes = v_i32.to_bytes();
    let u_i32 = new Pair<i32>(0, 0);
    u_i32.from_bytes(v_i32_bytes);
    log_message(u_i32.toString());

    let v_f32 = new Pair<f32>(2.5, 3.5);
    let v_f32_bytes = v_f32.to_bytes();
    let u_f32 = new Pair<f32>(0.0, 0.0);
    u_f32.from_bytes(v_f32_bytes);
    log_message(u_f32.toString());

    let v_f64 = new Pair<f64>(-2.5, 1.5);
    let v_f64_bytes = v_f64.to_bytes();
    let u_f64 = new Pair<f64>(0.0, 0.0);
    u_f64.from_bytes(v_f64_bytes);
    log_message(u_f64.toString());*/

    /*let v_i32 = new List<i32>();
    v_i32.push(1); v_i32.push(-1); v_i32.push(2); v_i32.push(3);
    let v_i32_bytes = v_i32.to_bytes();
    let u_i32 = new List<i32>();
    u_i32.from_bytes(v_i32_bytes);
    log_message(u_i32.toString());

    let v_f32 = new List<f32>();
    v_f32.push(1.5); v_f32.push(-1.3); v_f32.push(2.6); v_f32.push(3.9);
    let v_f32_bytes = v_f32.to_bytes();
    let u_f32 = new List<f32>();
    u_f32.from_bytes(v_f32_bytes);
    log_message(u_f32.toString());

    let v_bool = new List<bool>();
    v_bool.push(true); v_bool.push(false); v_bool.push(false); v_bool.push(true);
    let v_bool_bytes = v_bool.to_bytes();
    let u_bool = new List<bool>();
    u_bool.from_bytes(v_bool_bytes);
    log_message(u_bool.toString());*/

    /*let v_pair = new List<Pair<i32>>();
    v_pair.push(new Pair<i32>(1, 2)); v_pair.push(new Pair<i32>(-1, 0)); v_pair.push(new Pair<i32>(2, 1));
    log_message(list_pair_i32_from_bytes(list_pair_i32_to_bytes(v_pair)).toString());*/

    /*let v = new List<f32>();
    v.push(1.5); v.push(-1.5); v.push(0.5); v.push(-2.5); v.push(3.5);
    let v_bytes = v.to_bytes();
    let v_after = new List<f32>();
    v_after.from_bytes(v_bytes);
    log_message(v_after.toString());

    let u = new List<Pair<i32>>();
    u.push(new Pair<i32>(1, 2)); u.push(new Pair<i32>(-1, 3)); u.push(new Pair<i32>(2, -4));
    let u_bytes = list_pair_i32_to_bytes(u);
    let w = list_pair_i32_from_bytes(u_bytes);
    log_message(w.toString());*/

    /*let f = new List<Float32Array>();
    let f1 = new Float32Array(3); f1[0] = 0.1; f1[1] = -0.1; f1[2] = 0.5;
    let f2 = new Float32Array(5); f2[0] = 1.5; f2[1] = -1.5; f2[2] = 2.5; f2[3] = 3.5; f2[4] = -4.5;
    let f3 = new Float32Array(2); f3[0] = 7.3; f3[1] = -8.6; 
    f.push(f1); f.push(f2); f.push(f3);
    let f_bytes = list_float32array_to_bytes(f);
    let f1_bytes = float32array_to_bytes(f1);
    log_message(float32array_from_bytes(f1_bytes).toString());
    log_message(list_float32array_from_bytes(f_bytes).toString());*/

    /*let v_i32 = new StaticArray<i32>(4);
    v_i32[0] = 2; v_i32[1] = 4; v_i32[2] = -3; v_i32[3] = 1;
    let v_i32_bytes = staticarray_i32_to_bytes(v_i32);
    log_message(staticarray_i32_from_bytes(v_i32_bytes).toString());

    let v_f32 = new StaticArray<f32>(5);
    v_f32[0] = 2.5; v_f32[1] = 4.3; v_f32[2] = -3.6; v_f32[3] = 1.5; v_f32[4] = 2.2;
    let v_f32_bytes = staticarray_f32_to_bytes(v_f32);
    log_message(staticarray_f32_from_bytes(v_f32_bytes).toString());

    let v_bool = new StaticArray<bool>(3);
    v_bool[0] =true; v_bool[1] = false; v_bool[2] = true;
    let v_bool_bytes = staticarray_bool_to_bytes(v_bool);
    log_message(staticarray_bool_from_bytes(v_bool_bytes).toString());*/

    /*let v = new Map<i32, i32>();
    v.set(0, 2); v.set(-1, 12); v.set(7, 1);
    let v_bytes = map_i32_i32_to_bytes(v);
    log_message(map_to_string(map_i32_i32_from_bytes(v_bytes)));*/

    /*let v = new Map<i32, StaticArray<i32>>();
    let v0 = new StaticArray<i32>(2); v0[0] = 5; v0[1] = 7;
    let v1 = new StaticArray<i32>(3); v1[0] = -5; v1[1] = 1; v1[2] = 4;
    v.set(-1, v0); v.set(5, v1);
    let v_bytes = map_i32_staticarray_i32_to_bytes(v);
    log_message(v_bytes.toString());
    let v_map = map_i32_staticarray_i32_from_bytes(v_bytes);
    log_message(v_map.keys().toString());
    log_message(v_map.values().toString());*/

    /*let vertices = new StaticArray<f32>(15);
    vertices[0] = -4.0; vertices[1] = 0.0; vertices[2] = 0.0;
    vertices[3] = 0.0; vertices[4] = 0.0; vertices[5] = -4.0;
    vertices[6] = 0.0; vertices[7] = 0.0; vertices[8] = 0.0;
    vertices[9] = 4.0; vertices[10] = 0.0; vertices[11] = 0.0;
    vertices[12] = 0.0; vertices[13] = 0.0; vertices[14] = 4.0;
    let names = new StaticArray<i32>(5);
    names[0] = 0; names[1] = 1; names[2] = 2; names[3] = 3; names[4] = 4;
    let edges = new StaticArray<i32>(8);
    edges[0] = 0; edges[1] = 2;
    edges[2] = 1; edges[3] = 2;
    edges[4] = 3; edges[5] = 2;
    edges[6] = 4; edges[7] = 2;
    let graph = new Graph(vertices, names, edges);
    let graph_bytes = graph.to_bytes();
    let graph_b = new Graph();
    graph_b.from_bytes(graph_bytes);
    //log_message(graph_b.toString());
    let other_names = new StaticArray<i32>(5);
    other_names[0] = 10; other_names[1] = 11; other_names[2] = 12; other_names[3] = 13; other_names[4] = 14;
    let other_edges = new StaticArray<i32>(2);
    other_edges[0] = 10; other_edges[1] = 14; 
    let other_graph = new Graph(vertices, other_names, other_edges);
    let graphs_array = new StaticArray<Graph>(2);
    graphs_array[0] = graph; graphs_array[1] = other_graph;
    let graphs_array_bytes = staticarray_graph_to_bytes(graphs_array);
    log_message(staticarray_graph_from_bytes(graphs_array_bytes).toString());*/

    /*let v = new Map<i32, StaticArray<f32>>();
    let v0 = new StaticArray<f32>(2); v0[0] = 5.5; v0[1] = 7.5;
    let v1 = new StaticArray<f32>(3); v1[0] = -5.3; v1[1] = 1.6; v1[2] = 4.9;
    v.set(-1, v0); v.set(5, v1);
    let v_bytes = map_i32_staticarray_f32_to_bytes(v);
    log_message(v_bytes.toString());
    let v_map = map_i32_staticarray_f32_from_bytes(v_bytes);
    log_message(v_map.keys().toString());
    log_message(v_map.values().toString());*/

    /*let nodes = new StaticArray<NavmeshNode>(2);
    for(let i = 0, len = nodes.length; i < len; i++){
        let vertices = new StaticArray<f32>(12);
        vertices[0] = -4.0; vertices[1] = 2.0 * <f32>i; vertices[2] = -4.0;
        vertices[3] = 4.0; vertices[4] = 2.0 * <f32>i; vertices[5] = -4.0;
        vertices[6] = 4.0; vertices[7] = 2.0 * <f32>i; vertices[8] = 4.0;
        vertices[9] = -4.0; vertices[10] = 2.0 * <f32>i; vertices[11] = 4.0;
        let polygon = new StaticArray<i32>(4);
        polygon[0] = 0; polygon[1] = 1; polygon[2] = 2; polygon[3] = 3;
        let node = new NavmeshNode(vertices, i, polygon);
        let node_bytes = node.to_bytes();
        let node_b = new NavmeshNode();
        node_b.from_bytes(node_bytes);
        //log_message(node_b.toString());
        nodes[i] = node;
    }
    let nodes_bytes = staticarray_navmeshnode_to_bytes(nodes);
    log_message(staticarray_navmeshnode_from_bytes(nodes_bytes).toString());*/

    /*let v = new StaticArray<StaticArray<i32>>(3);
    let v0 = new StaticArray<i32>(2);
    v0[0] = 1; v0[1] = -1;
    let v1 = new StaticArray<i32>(3);
    v1[0] = 2; v1[1] = -3; v1[2] = 4;
    let v2 = new StaticArray<i32>(2);
    v2[0] = -3; v2[1] = 5;
    v[0] = v0; v[1] = v1; v[2] = v2;
    let v_bytes = staticarray_staticarray_i32_to_bytes(v);
    log_message(staticarray_staticarray_i32_from_bytes(v_bytes).toString());*/

    /*let v = false;
    log_message(bool_from_bytes(bool_to_bytes(v)).toString());*/

    /*let nodes = new StaticArray<NavmeshNode>(3);
    let vertices = new StaticArray<f32>(15);
    vertices[0] = 0.0; vertices[1] = 0.0; vertices[2] = 0.0;
    vertices[3] = 2.0; vertices[4] = 0.0; vertices[5] = 0.0;
    vertices[6] = 0.0; vertices[7] = 0.0; vertices[8] = 2.0;
    vertices[9] = 0.0; vertices[10] = 0.0; vertices[11] = -2.0;
    vertices[12] = -2.0; vertices[13] = 0.0; vertices[14] = -2.0;
    let node0 = new NavmeshNode(vertices, 0, [0, 1, 2]);
    let node1 = new NavmeshNode(vertices, 1, [0, 3, 1]);
    let node2 = new NavmeshNode(vertices, 2, [0, 4, 3]);
    nodes[0] = node0; nodes[1] = node1; nodes[2] = node2;
    let bvh = new NavmeshBVH(nodes);
    let bvh_bytes = bvh.to_bytes();
    let bvh_b = new NavmeshBVH();
    bvh_b.from_bytes(bvh_bytes, nodes);
    log_message(bvh_b.toString());*/

    /*let bvh = new TrianglesBVH([
        0.0, 0.0, 0.0,
        2.0, 0.0, 0.0,
        0.0, 0.0, 2.0,

        0.0, 0.0, 0.0,
        0.0, 0.0, -2.0,
        2.0, 0.0, 0.0,

        0.0, 0.0, 0.0,
        -2.0, 0.0, -2.0,
        0.0, 0.0, -2.0
        ]);

    let bvh_b = new TrianglesBVH();
    bvh_b.from_bytes(bvh.to_bytes());
    log_message(bvh_b.toString());*/

    let vertices = new StaticArray<f32>(level_03_vertices.length)
    for(let i = 0; i < vertices.length; i++){
        vertices[i] = <f32>level_03_vertices[i];
    }

    let polygons = new StaticArray<i32>(level_03_polygons.length)
    for(let i = 0; i < polygons.length; i++){
        polygons[i] = level_03_polygons[i];
    }

    let sizes = new StaticArray<i32>(level_03_sizes.length)
    for(let i = 0; i < sizes.length; i++){
        sizes[i] = level_03_sizes[i];
    }
    /*let vertices: StaticArray<f32> = [-3.0, 0.0, -3.0, 
                                      -3.0, 0.0, 3.2, 
                                      3.0, 0.0, 3.0, 
                                      3.0, 0.0, -3.0, 
                                      -1.5, 0.0, -1.5, 
                                      1.5, 0.0, -1.5, 
                                      1.5, 0.0, 1.5, 
                                      -1.5, 0., 1.5];
    let polygons: StaticArray<i32> = [0, 4, 5, 3, 4, 0, 1, 7, 3, 5, 6, 2, 7, 1, 2, 6];
    let sizes: StaticArray<i32> = [4, 4, 4, 4];*/

    let nm = new Navmesh(vertices, polygons, sizes);
    let nm_bytes = nm.to_bytes();

    let nm_b = new Navmesh();
    nm_b.from_bytes(nm_bytes);

    //let path = nm.search_path(-2.0, 0.2, -2.0, 2.0, 0.2, 2.0);
    //let path_b = nm_b.search_path(-2.0, 0.2, -2.0, 2.0, 0.2, 2.0);
    //log_message(path.toString());
    //log_message(path_b.toString());
    //log_message(arrays_eq(path, path_b).toString());
    //let bvh = nm_b.m_nodes_bvh;
    //log_message(bvh.toString());
    //log_message(bvh.sample(2.0, 0.0, 2.0).toString());

    const points_count = level_03_points.length / 3;
    for(let p = 10; p < 20; p++){
        const s_x = <f32>level_03_points[p*3];
        const s_y = <f32>level_03_points[p*3 + 1];
        const s_z = <f32>level_03_points[p*3 + 2];

        const e_x = <f32>level_03_points[(p + 1)*3];
        const e_y = <f32>level_03_points[(p + 1)*3 + 1];
        const e_z = <f32>level_03_points[(p + 1)*3 + 2];

        let path = nm.search_path(s_x, s_y, s_z, e_x, e_y, e_z);
        let path_b = nm_b.search_path(s_x, s_y, s_z, e_x, e_y, e_z);

        const x = <f32>level_03_points[(p + 2)*3];
        const y = <f32>level_03_points[(p + 2)*3 + 1];
        const z = <f32>level_03_points[(p + 2)*3 + 2];
        let s = nm.sample(x, y, z);
        let s_b = nm_b.sample(x, y, z);

        log_message(arrays_eq(path, path_b).toString() + ", " + arrays_eq(s, s_b).toString());
    }

    let l = new List<i32>();
    l.push(12); l.push(21);
    log_message(l.toString());
}

function main(): void {
    const vertices = [-8.0, 0.0, -8.0, -8.0, 0.0, 0.0, -8.0, 0.0, 8.0, 0.0, 0.0, -8.0, 0.0, 0.0, 0.0, 0.0, 0.0, 8.0, 8.0, 0.0, -8.0, 8.0, 0.0, 0.0, 8.0, 0.0, 8.0, -0.5, 0.0, -0.5, 0.5, 0.0, -0.5, -0.5, 2.0, -0.5, 0.5, 2.0, -0.5, -0.5, 0.0, 0.5, 0.5, 0.0, 0.5, -0.5, 2.0, 0.5, 0.5, 2.0, 0.5, -4.568728, 0.0, -1.40926, -3.867953, 0.0, -2.122643, -4.568728, 2.0, -1.40926, -3.867953, 2.0, -2.122643, -3.855345, 0.0, -0.708485, -3.15457, 0.0, -1.421868, -3.855345, 2.0, -0.708485, -3.15457, 2.0, -1.421868, -6.089065, 0.0, 1.370583, -6.106895, 0.0, 0.370742, -6.089065, 2.0, 1.370583, -6.106895, 2.0, 0.370742, -5.089224, 0.0, 1.352753, -5.107054, 0.0, 0.352912, -5.089224, 2.0, 1.352753, -5.107054, 2.0, 0.352912, -4.493502, 0.0, 4.496904, -4.511332, 0.0, 3.497063, -4.493502, 2.0, 4.496904, -4.511332, 2.0, 3.497063, -3.493661, 0.0, 4.479074, -3.511491, 0.0, 3.479233, -3.493661, 2.0, 4.479074, -3.511491, 2.0, 3.479233];
    const polygons = [0, 1, 4, 3, 1, 2, 5, 4, 3, 4, 7, 6, 4, 5, 8, 7, 9, 11, 12, 10, 13, 14, 16, 15, 9, 13, 15, 11, 10, 12, 16, 14, 11, 15, 16, 12, 17, 19, 20, 18, 21, 22, 24, 23, 17, 21, 23, 19, 18, 20, 24, 22, 19, 23, 24, 20, 25, 27, 28, 26, 29, 30, 32, 31, 25, 29, 31, 27, 26, 28, 32, 30, 27, 31, 32, 28, 33, 35, 36, 34, 37, 38, 40, 39, 33, 37, 39, 35, 34, 36, 40, 38, 35, 39, 40, 36];
    const sizes = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

    let baker = new NavmeshBaker();
    let geo_vertices = new StaticArray<f32>(vertices.length);
    for(let i = 0; i < vertices.length; i++) {
        geo_vertices[i] = <f32>vertices[i];
    }
    let geo_polygons = new StaticArray<i32>(polygons.length);
    for(let i = 0; i < polygons.length; i++) {
        geo_polygons[i] = polygons[i];
    }
    let geo_sizes = new StaticArray<i32>(sizes.length);
    for(let i = 0; i < sizes.length; i++) {
        geo_sizes[i] = sizes[i];
    }

    baker.add_geometry(geo_vertices, geo_polygons, geo_sizes);
    baker.bake(0.3, //cell_size: float,
               0.2, //cell_height: float,
               2.0, //agent_height: float,
               0.6, //agent_radius: float,
               0.9, //agent_max_climb: float,
               45.0, //agent_max_slope: float,
               8, //region_min_size: int,
               20, //region_merge_size: int,
               12.0, //edge_max_len: float,
               1.3, //edge_max_error: float,
               6, //verts_per_poly: int,
               6.0, //detail_sample_distance: float,
               1.0); //detail_sample_maximum_error: float
    log_message(baker.get_navmesh_vertices().toString());
    log_message(baker.get_navmesh_polygons().toString());
    log_message(baker.get_navmesh_sizes().toString());
}

main();