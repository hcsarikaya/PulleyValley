// src/ammoLoader.js

// 1) Use a default import (most ammo builds only export a default factory, not a named one)
import AmmoModule from '../../builds/ammo.wasm.js';

// 2) Export an async function that awaits the WASM initialization
export async function loadAmmo() {
    const AmmoLib = await AmmoModule({
        // If your .wasm is in ../builds, adjust the path accordingly:
        locateFile(path) {
            if (path.endsWith('.wasm')) {
                // Return the relative or absolute path to the .wasm file
                return '../builds/ammo.wasm.wasm';
            }
            return path;
        }
    });
    return AmmoLib;
}
