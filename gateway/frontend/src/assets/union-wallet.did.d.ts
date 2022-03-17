import type { Principal } from '@dfinity/principal';
export interface AddEnumeratedRolesRequest {
  'enumerated_roles_to_add' : Array<RoleId>,
  'role_id' : RoleId,
}
export interface AttachRoleToPermissionRequest {
  'role_id' : RoleId,
  'permission_id' : PermissionId,
}
export interface AuthorizeExecutionRequest { 'task_id' : TaskId }
export type AuthorizeExecutionResponse = ExecuteResponse;
export interface AuthorizedRequest { 'rnp' : RoleAndPermission }
export type CallResult = { 'Ok' : string } |
  { 'Err' : [RejectionCode, string] };
export interface CreatePermissionRequest {
  'name' : string,
  'scope' : PermissionScope,
  'targets' : Array<PermissionTarget>,
}
export interface CreatePermissionResponse { 'permission_id' : PermissionId }
export interface CreateRoleRequest { 'role_type' : RoleType }
export interface CreateRoleResponse { 'role_id' : RoleId }
export interface DetachRoleFromPermissionRequest {
  'role_id' : RoleId,
  'permission_id' : PermissionId,
}
export interface ExecuteRequest {
  'rnp' : RoleAndPermission,
  'title' : string,
  'authorization_delay_nano' : bigint,
  'description' : string,
  'program' : Program,
}
export type ExecuteResponse = { 'ScheduledForAuthorization' : TaskId } |
  { 'Executed' : HistoryEntryId };
export interface FractionOf {
  'name' : string,
  'description' : string,
  'fraction' : number,
  'enumerated' : Array<RoleId>,
}
export interface GetHistoryEntriesRequest {
  'ids' : Array<HistoryEntryId>,
  'rnp' : RoleAndPermission,
}
export interface GetHistoryEntriesResponse { 'entries' : Array<HistoryEntry> }
export interface GetHistoryEntryIdsResponse { 'ids' : Array<HistoryEntryId> }
export interface GetMyPermissionsResponse { 'permissions' : Array<Permission> }
export interface GetMyRolesResponse { 'roles' : Array<Role> }
export interface GetPermissionIdsResponse { 'ids' : Array<PermissionId> }
export interface GetPermissionsAttachedToRolesRequest {
  'rnp' : RoleAndPermission,
  'role_ids' : Array<RoleId>,
}
export interface GetPermissionsAttachedToRolesResponse {
  'result' : Array<[RoleId, PermissionId]>,
}
export interface GetPermissionsByPermissionTargetRequest {
  'rnp' : RoleAndPermission,
  'target' : PermissionTarget,
}
export interface GetPermissionsByPermissionTargetResponse {
  'ids' : Array<PermissionId>,
}
export interface GetPermissionsRequest {
  'ids' : Array<PermissionId>,
  'rnp' : RoleAndPermission,
}
export interface GetPermissionsResponse { 'permissions' : Array<Permission> }
export interface GetRoleIdsResponse { 'ids' : Array<RoleId> }
export interface GetRolesAttachedToPermissionsRequest {
  'rnp' : RoleAndPermission,
  'permission_ids' : Array<PermissionId>,
}
export interface GetRolesAttachedToPermissionsResponse {
  'result' : Array<[PermissionId, RoleId]>,
}
export interface GetRolesRequest {
  'ids' : Array<RoleId>,
  'rnp' : RoleAndPermission,
}
export interface GetRolesResponse { 'roles' : Array<Role> }
export interface GetScheduledForAuthorizationExecutionsResponse {
  'entries' : Array<HistoryEntry>,
}
export interface HistoryEntry {
  'id' : HistoryEntryId,
  'title' : string,
  'authorized_by' : Array<Principal>,
  'entry_type' : HistoryEntryType,
  'role_id' : RoleId,
  'description' : string,
  'timestamp' : bigint,
  'permission_id' : PermissionId,
  'program' : Program,
}
export type HistoryEntryId = bigint;
export type HistoryEntryType = { 'Executed' : [bigint, Array<CallResult>] } |
  { 'Declined' : [bigint, string] } |
  { 'Pending' : null };
export type Iterations = { 'Exact' : bigint } |
  { 'Infinite' : null };
export interface Permission {
  'id' : PermissionId,
  'name' : string,
  'scope' : PermissionScope,
  'targets' : Array<PermissionTarget>,
}
export type PermissionId = number;
export type PermissionScope = { 'Blacklist' : null } |
  { 'Whitelist' : null };
export type PermissionTarget = { 'Endpoint' : RemoteCallEndpoint } |
  { 'SelfEmptyProgram' : null } |
  { 'Canister' : Principal };
export interface Profile {
  'name' : string,
  'description' : string,
  'principal_id' : Principal,
}
export type Program = { 'Empty' : null } |
  { 'RemoteCallSequence' : Array<RemoteCallPayload> };
export interface QuantityOf {
  'name' : string,
  'description' : string,
  'enumerated' : Array<RoleId>,
  'quantity' : number,
}
export type RejectionCode = { 'NoError' : null } |
  { 'CanisterError' : null } |
  { 'SysTransient' : null } |
  { 'DestinationInvalid' : null } |
  { 'Unknown' : null } |
  { 'SysFatal' : null } |
  { 'CanisterReject' : null };
export interface RemoteCallEndpoint {
  'canister_id' : Principal,
  'method_name' : string,
}
export interface RemoteCallPayload {
  'args_candid' : Array<string>,
  'endpoint' : RemoteCallEndpoint,
  'cycles' : bigint,
}
export interface RemovePermissionRequest { 'permission_id' : PermissionId }
export interface RemovePermissionResponse { 'permission' : Permission }
export interface RemoveRoleRequest { 'role_id' : RoleId }
export interface RemoveRoleResponse { 'role' : Role }
export interface Role { 'id' : RoleId, 'role_type' : RoleType }
export interface RoleAndPermission {
  'role_id' : RoleId,
  'permission_id' : PermissionId,
}
export type RoleId = number;
export type RoleType = { 'FractionOf' : FractionOf } |
  { 'Profile' : Profile } |
  { 'Everyone' : null } |
  { 'QuantityOf' : QuantityOf };
export interface ScheduledTask {
  'id' : TaskId,
  'scheduled_at' : bigint,
  'scheduling_options' : SchedulingOptions,
  'rescheduled_at' : [] | [bigint],
  'payload' : Task,
  'delay_passed' : boolean,
}
export interface SchedulingOptions {
  'interval_nano' : bigint,
  'iterations' : Iterations,
  'delay_nano' : bigint,
}
export interface SubtractEnumeratedRolesRequest {
  'enumerated_roles_to_subtract' : Array<RoleId>,
  'role_id' : RoleId,
}
export interface Task { 'data' : Array<number> }
export type TaskId = bigint;
export interface UpdatePermissionRequest {
  'new_targets' : [] | [Array<PermissionTarget>],
  'new_name' : [] | [string],
  'permission_id' : PermissionId,
  'new_scope' : [] | [PermissionScope],
}
export interface UpdateRoleRequest {
  'role_id' : RoleId,
  'new_role_type' : RoleType,
}
export interface _SERVICE {
  'add_role_owners' : (arg_0: AddEnumeratedRolesRequest) => Promise<undefined>,
  'attach_role_to_permission' : (
      arg_0: AttachRoleToPermissionRequest,
    ) => Promise<undefined>,
  'authorize_execution' : (arg_0: AuthorizeExecutionRequest) => Promise<
      AuthorizeExecutionResponse
    >,
  'create_permission' : (arg_0: CreatePermissionRequest) => Promise<
      CreatePermissionResponse
    >,
  'create_role' : (arg_0: CreateRoleRequest) => Promise<CreateRoleResponse>,
  'detach_role_from_permission' : (
      arg_0: DetachRoleFromPermissionRequest,
    ) => Promise<undefined>,
  'execute' : (arg_0: ExecuteRequest) => Promise<ExecuteResponse>,
  'export_candid' : () => Promise<string>,
  'get_history_entries' : (arg_0: GetHistoryEntriesRequest) => Promise<
      GetHistoryEntriesResponse
    >,
  'get_history_entry_ids' : (arg_0: AuthorizedRequest) => Promise<
      GetHistoryEntryIdsResponse
    >,
  'get_my_permissions' : () => Promise<GetMyPermissionsResponse>,
  'get_my_roles' : () => Promise<GetMyRolesResponse>,
  'get_permission_ids' : (arg_0: AuthorizedRequest) => Promise<
      GetPermissionIdsResponse
    >,
  'get_permissions' : (arg_0: GetPermissionsRequest) => Promise<
      GetPermissionsResponse
    >,
  'get_permissions_attached_to_roles' : (
      arg_0: GetPermissionsAttachedToRolesRequest,
    ) => Promise<GetPermissionsAttachedToRolesResponse>,
  'get_permissions_by_permission_target' : (
      arg_0: GetPermissionsByPermissionTargetRequest,
    ) => Promise<GetPermissionsByPermissionTargetResponse>,
  'get_role_ids' : (arg_0: AuthorizedRequest) => Promise<GetRoleIdsResponse>,
  'get_roles' : (arg_0: GetRolesRequest) => Promise<GetRolesResponse>,
  'get_roles_attached_to_permissions' : (
      arg_0: GetRolesAttachedToPermissionsRequest,
    ) => Promise<GetRolesAttachedToPermissionsResponse>,
  'get_scheduled_for_authorization_executions' : (
      arg_0: AuthorizedRequest,
    ) => Promise<GetScheduledForAuthorizationExecutionsResponse>,
  'remove_permission' : (arg_0: RemovePermissionRequest) => Promise<
      RemovePermissionResponse
    >,
  'remove_role' : (arg_0: RemoveRoleRequest) => Promise<RemoveRoleResponse>,
  'subtract_role_owners' : (arg_0: SubtractEnumeratedRolesRequest) => Promise<
      undefined
    >,
  'update_permission' : (arg_0: UpdatePermissionRequest) => Promise<undefined>,
  'update_role' : (arg_0: UpdateRoleRequest) => Promise<undefined>,
}
