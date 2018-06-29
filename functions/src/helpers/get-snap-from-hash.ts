import { db } from '../app-helpers';
import { json_fmt } from "../objects/result-row";

export const get_snap_from_hash = async (hash : string) : Promise<json_fmt> => {

    if (!hash) {
        throw new Error("get_snap_from_hash: ricevuto hash non valido: " + hash);
    }
    const hash_path = hash.split("-").join("/");
    const episode_snap = await db.ref(`rows/${hash_path}`).once('value');

    const snap : json_fmt = episode_snap.val();
    return snap
}