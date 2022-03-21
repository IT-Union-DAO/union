import type { Principal } from '@dfinity/principal';
export interface SpawnRequest { 'wasm_module' : Array<number> }
export interface UpdateCodeRequest { 'wasm_module' : Array<number> }
export interface _SERVICE {
  'export_candid' : () => Promise<string>,
  'get_spawned_instances' : () => Promise<Array<Principal>>,
  'spawn' : (arg_0: SpawnRequest) => Promise<Principal>,
  'update_code' : (arg_0: UpdateCodeRequest) => Promise<Principal>,
}
