/*use crate::api::{
    ActivateProfileRequest, AddEnumeratedRolesRequest, AttachRoleToPermissionRequest,
    AuthorizeExecutionRequest, AuthorizeExecutionResponse, BatchOperation, CommitBatchArguments,
    CreateAssetArguments, CreateBatchRequest, CreateBatchResponse, CreateChunkRequest,
    CreateChunkResponse, CreatePermissionRequest, CreatePermissionResponse, CreateRoleRequest,
    CreateRoleResponse, DeleteAssetArguments, DeleteBatchesRequest,
    DetachRoleFromPermissionRequest, EditProfileRequest, ExecuteRequest, ExecuteResponse,
    GetBatchesResponse, GetChunkRequest, GetChunkResponse, GetHistoryEntriesRequest,
    GetHistoryEntriesResponse, GetHistoryEntryIdsResponse, GetInfoResponse,
    GetMyPermissionsResponse, GetMyRolesResponse, GetPermissionIdsResponse,
    GetPermissionsAttachedToRolesRequest, GetPermissionsAttachedToRolesResponse,
    GetPermissionsByPermissionTargetRequest, GetPermissionsByPermissionTargetResponse,
    GetPermissionsRequest, GetPermissionsResponse, GetRoleIdsResponse,
    GetRolesAttachedToPermissionsRequest, GetRolesAttachedToPermissionsResponse, GetRolesRequest,
    GetRolesResponse, GetScheduledForAuthorizationExecutionsRequest,
    GetScheduledForAuthorizationExecutionsResponse, LockBatchesRequest, ProfileActivatedEvent,
    ProfileCreatedEvent, RemovePermissionRequest, RemovePermissionResponse, RemoveRoleRequest,
    RemoveRoleResponse, SendBatchRequest, SetAssetContentArguments, SubtractEnumeratedRolesRequest,
    UpdateInfoRequest, UpdatePermissionRequest, UpdateRoleRequest,
};
use crate::common::roles::{RoleId, RoleType};
use crate::common::utils::IAssetCanister;
use ic_cdk::api::time;
use ic_cdk::export::Principal;
use ic_cdk::storage::{stable_restore, stable_save};
use ic_cdk::{caller, id, trap};
use ic_cdk_macros::{heartbeat, init, post_upgrade, pre_upgrade, query, update};
use ic_cron::implement_cron;
use ic_cron::types::{Iterations, SchedulingOptions};
use ic_event_hub::{implement_event_emitter, implement_subscribe, implement_unsubscribe};
use serde_bytes::ByteBuf;
use shared::candid::ToCandidType;
use shared::validation::validate_and_trim_str;
*/
use crate::repository::{set_repositories, take_repositories};
use crate::settings::{init_settings, set_settings, take_settings};
use candid::Principal;
use ic_cdk::api::time;
use ic_cdk::storage::{stable_restore, stable_save};
use ic_cdk_macros::{heartbeat, init, post_upgrade, pre_upgrade};
use ic_cron::implement_cron;
use ic_event_hub::{implement_event_emitter, implement_subscribe, implement_unsubscribe};
use shared::time::secs;

pub mod api;
pub mod common;
pub mod guards;
pub mod helpers;
pub mod repository;
//pub mod service;
pub mod settings;

#[init]
fn init(gateway: Principal, history_ledger: Principal, wallet_creator: Principal) {
    init_settings(gateway, history_ledger, time());
    /*
    ProfileService::create_profile(
        wallet_creator,
        String::from("Wallet creator"),
        String::from("A person, who created this wallet"),
    )
    .expect("Unable to create wallet creator profile");*/
}

#[post_upgrade]
fn post_upgrade_hook() {
    let (repos, cron, events, settings) = stable_restore().expect("Unable to stable restore");

    set_repositories(repos);
    set_settings(settings);
    _put_cron_state(cron);
    _put_event_hub_state(events);
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    stable_save((
        take_repositories(),
        _take_cron_state(),
        _take_event_hub_state(),
        take_settings(),
    ))
    .expect("Unable to stable save");
}

implement_cron!();
// forms batches each 10 seconds, sized up to 2MB - this sets max program payload size for votings
implement_event_emitter!(secs(10), 2 * 1024 * 1024);

// TODO: only allow for gateway and history ledgers
implement_subscribe!();
implement_unsubscribe!();
/*
// -------------- EXECUTION & HISTORY ----------------

#[update]
fn execute(req: ExecuteRequest) -> ExecuteResponse {
    let caller = caller();
    let state = get_state();

    state
        .validate_authorized_request(
            &caller,
            &req.rnp.role_id,
            &req.rnp.permission_id,
            &req.program,
        )
        .expect("Access denied");

    // validate inputs
    let title = validate_and_trim_str(req.title, 3, 100, "Title").expect("Validation error");
    let description =
        validate_and_trim_str(req.description, 3, 100, "Description").expect("Validation error");

    // if the role is fulfilled - execute immediately, otherwise - put in the authorization queue
    let authorized_by = vec![caller];
    let is_role_fulfilled = state
        .roles
        .is_role_fulfilled(&req.rnp.role_id, &authorized_by);

    let timestamp_before = time();
    let entry = state.execution_history.create_pending_entry(
        title,
        description,
        req.program,
        timestamp_before,
        req.rnp.role_id,
        req.rnp.permission_id,
        authorized_by,
    );

    if is_role_fulfilled {
        let id = entry.id;
        execute_program_and_log(entry);

        ExecuteResponse::Executed(id)
    } else {
        let task_id = cron_enqueue(
            TaskType::CallAuthorization(entry),
            SchedulingOptions {
                delay_nano: req.authorization_delay_nano,
                interval_nano: 0,
                iterations: Iterations::Exact(1),
            },
        )
        .expect("Unable to schedule an execution");

        ExecuteResponse::ScheduledForAuthorization(task_id)
    }
}

#[update]
fn authorize_execution(req: AuthorizeExecutionRequest) -> AuthorizeExecutionResponse {
    let cron_state = get_cron_state();
    let task = cron_state
        .get_task_mut(&req.task_id)
        .expect("Task not found");

    let task_type: TaskType = task
        .get_payload()
        .expect("Unable to deserialize the payload");

    match task_type {
        TaskType::CallAuthorization(mut entry) => {
            let caller = caller();
            let state = get_state();

            // if the caller has the provided role
            state
                .roles
                .is_role_owner(&caller, &entry.role_id)
                .expect("Caller does not have the role");

            entry.authorized_by.push(caller);

            let is_role_fulfilled = state
                .roles
                .is_role_fulfilled(&entry.role_id, &entry.authorized_by);

            if is_role_fulfilled {
                cron_dequeue(req.task_id).expect("Unable to dequeue the task");

                let id = entry.id;
                execute_program_and_log(entry);

                AuthorizeExecutionResponse::Executed(id)
            } else {
                task.set_payload(TaskType::CallAuthorization(entry));

                AuthorizeExecutionResponse::ScheduledForAuthorization(req.task_id)
            }
        }
    }
}

#[query]
fn get_scheduled_for_authorization_executions(
    req: GetScheduledForAuthorizationExecutionsRequest,
) -> GetScheduledForAuthorizationExecutionsResponse {
    let state = get_state();
    let caller = caller();

    if !state.is_query_caller_authorized(
        &id(),
        &caller,
        "get_scheduled_for_authorization_executions",
    ) {
        trap("Access denied");
    }

    let entries = match req.task_ids {
        None => get_cron_state()
            .get_tasks_cloned()
            .into_iter()
            .map(|it| {
                let task_type = it
                    .get_payload::<TaskType>()
                    .expect("Unable to deserialize a task");

                match task_type {
                    TaskType::CallAuthorization(e) => (it.id, e),
                }
            })
            .collect(),
        Some(ids) => {
            let mut res = vec![];

            for id in ids {
                let task = get_cron_state()
                    .get_task(&id)
                    .unwrap_or_else(|| panic!("Unable to get task with id {}", id));

                let task_type = task
                    .get_payload::<TaskType>()
                    .expect("Unable to deserialize a task");

                match task_type {
                    TaskType::CallAuthorization(e) => res.push((id, e)),
                }
            }

            res
        }
    };

    GetScheduledForAuthorizationExecutionsResponse { entries }
}

implement_cron!();
implement_event_emitter!(10 * 1_000_000_000, 100 * 1024);
implement_subscribe!(guard = "only_gateway");
implement_unsubscribe!(guard = "only_gateway");

#[heartbeat]
fn tick() {
    send_events();

    for task in cron_ready_tasks() {
        match task
            .get_payload::<TaskType>()
            .expect("Unable to deserialize the payload")
        {
            TaskType::CallAuthorization(mut entry) => {
                let state = get_state();
                let is_role_fulfilled = state
                    .roles
                    .is_role_fulfilled(&entry.role_id, &entry.authorized_by);

                if is_role_fulfilled {
                    execute_program_and_log(entry);
                } else {
                    let state = get_state();
                    let timestamp_after = time();

                    entry.set_declined(timestamp_after, String::from("The role was not fulfilled"));
                    state.execution_history.add_executed_entry(entry);
                }
            }
        }
    }
}

#[query]
pub fn get_history_entry_ids() -> GetHistoryEntryIdsResponse {
    let state = get_state();
    let caller = caller();

    if !state.is_query_caller_authorized(&id(), &caller, "get_history_entry_ids") {
        trap("Access denied");
    }

    let ids = state.execution_history.get_entry_ids_cloned();

    GetHistoryEntryIdsResponse { ids }
}

#[query]
pub fn get_history_entries(req: GetHistoryEntriesRequest) -> GetHistoryEntriesResponse {
    let state = get_state();
    let caller = caller();

    if !state.is_query_caller_authorized(&id(), &caller, "get_history_entries") {
        trap("Access denied");
    }

    let mut entries = vec![];

    for id in &req.ids {
        let entry = state
            .execution_history
            .get_entry_by_id(id)
            .unwrap_or_else(|_| panic!("Unable to get entry with id {}", id));

        entries.push(entry.clone());
    }

    GetHistoryEntriesResponse { entries }
}

// ------------------ ROLES --------------------

#[update(guard = "only_self_guard")]
pub fn create_role(req: CreateRoleRequest) -> CreateRoleResponse {
    let state = get_state();

    let role_id = state
        .roles
        .create_role(req.role_type)
        .expect("Unable to create a role");

    if let RoleType::Profile(p) = &state.roles.get_role(&role_id).unwrap().role_type {
        emit(ProfileCreatedEvent {
            profile_role_id: role_id,
            profile_owner: p.principal_id,
        });
    }

    CreateRoleResponse { role_id }
}

#[update(guard = "only_self_guard")]
pub fn update_role(req: UpdateRoleRequest) {
    let state = get_state();

    state
        .roles
        .update_role(&req.role_id, req.new_role_type)
        .expect("Unable to update a role");
}

#[update(guard = "only_self_guard")]
pub fn remove_role(req: RemoveRoleRequest) -> RemoveRoleResponse {
    let state = get_state();

    let role = state
        .remove_role(&req.role_id)
        .expect("Unable to remove a role");

    if let RoleType::Profile(p) = &role.role_type {
        if !p.active {
            // triggers removal of notification
            emit(ProfileActivatedEvent {
                profile_owner: p.principal_id,
            });
        }
    }

    RemoveRoleResponse { role }
}

#[update(guard = "only_self_guard")]
pub fn edit_profile(req: EditProfileRequest) {
    let state = get_state();

    state
        .roles
        .edit_profile(&req.role_id, req.new_name, req.new_description)
        .expect("Unable to edit profile");
}

#[update]
pub fn activate_profile(req: ActivateProfileRequest) {
    let caller = caller();

    get_state()
        .roles
        .activate_profile(&req.role_id, &caller)
        .expect("Unable to activate profile");

    emit(ProfileActivatedEvent {
        profile_owner: caller,
    });
}

#[update(guard = "only_self_guard")]
pub fn add_enumerated_roles(req: AddEnumeratedRolesRequest) {
    let state = get_state();

    state
        .roles
        .add_enumerated_roles(&req.role_id, req.enumerated_roles_to_add)
        .expect("Unable to add enumerated roles");
}

#[update(guard = "only_self_guard")]
pub fn subtract_enumerated_roles(req: SubtractEnumeratedRolesRequest) {
    let state = get_state();

    state
        .roles
        .subtract_enumerated_roles(&req.role_id, req.enumerated_roles_to_subtract)
        .expect("Unable to subtract enumerated roles");
}

#[query]
pub fn get_role_ids() -> GetRoleIdsResponse {
    let state = get_state();
    let caller = caller();

    if !state.is_query_caller_authorized(&id(), &caller, "get_role_ids") {
        trap("Access denied");
    }

    let ids = state.roles.get_role_ids_cloned();

    GetRoleIdsResponse { ids }
}

#[query]
pub fn get_roles(req: GetRolesRequest) -> GetRolesResponse {
    let state = get_state();
    let caller = caller();

    if !state.is_query_caller_authorized(&id(), &caller, "get_roles") {
        trap("Access denied");
    }

    let mut roles = vec![];

    for id in &req.ids {
        let role = state
            .roles
            .get_role(id)
            .unwrap_or_else(|_| panic!("Unable to get role with id {}", id));

        roles.push(role.clone());
    }

    GetRolesResponse { roles }
}

#[query]
pub fn get_my_roles() -> GetMyRolesResponse {
    let id = caller();
    let state = get_state();

    let role_ids = state.roles.get_role_ids_by_role_owner_cloned(&id);
    let mut roles = vec![];

    for role_id in &role_ids {
        let role = state.roles.get_role(role_id).unwrap();
        roles.push(role.clone());
    }

    GetMyRolesResponse { roles }
}

// ---------------------- PERMISSIONS ----------------

#[update(guard = "only_self_guard")]
pub fn create_permission(req: CreatePermissionRequest) -> CreatePermissionResponse {
    let state = get_state();

    let permission_id = state
        .permissions
        .create_permission(req.name, req.targets, req.scope);

    CreatePermissionResponse { permission_id }
}

#[update(guard = "only_self_guard")]
pub fn update_permission(req: UpdatePermissionRequest) {
    let state = get_state();

    state
        .permissions
        .update_permission(
            &req.permission_id,
            req.new_name,
            req.new_targets,
            req.new_scope,
        )
        .expect("Unable to update a permission");
}

#[update(guard = "only_self_guard")]
pub fn remove_permission(req: RemovePermissionRequest) -> RemovePermissionResponse {
    let state = get_state();

    let permission = state
        .remove_permission(&req.permission_id)
        .expect("Unable to remove a permission");

    RemovePermissionResponse { permission }
}

#[query]
pub fn get_permission_ids() -> GetPermissionIdsResponse {
    let state = get_state();
    let caller = caller();

    if !state.is_query_caller_authorized(&id(), &caller, "get_permission_ids") {
        trap("Access denied");
    }

    let ids = state.permissions.get_permission_ids_cloned();

    GetPermissionIdsResponse { ids }
}

#[query]
pub fn get_permissions(req: GetPermissionsRequest) -> GetPermissionsResponse {
    let state = get_state();
    let caller = caller();

    if !state.is_query_caller_authorized(&id(), &caller, "get_permissions") {
        trap("Access denied");
    }

    let mut permissions = vec![];

    for id in &req.ids {
        let permission = state
            .permissions
            .get_permission(id)
            .unwrap_or_else(|_| panic!("Unable to get a permission with id {}", id));

        permissions.push(permission.clone());
    }

    GetPermissionsResponse { permissions }
}

#[query]
pub fn get_my_permissions() -> GetMyPermissionsResponse {
    let id = caller();
    let state = get_state();

    let permission_ids = state.get_permission_ids_of_cloned(&id);

    let mut permissions = vec![];
    for permission_id in &permission_ids {
        let permission = state.permissions.get_permission(permission_id).unwrap();

        permissions.push(permission.clone());
    }

    GetMyPermissionsResponse { permissions }
}

#[query]
pub fn get_permissions_by_permission_target(
    req: GetPermissionsByPermissionTargetRequest,
) -> GetPermissionsByPermissionTargetResponse {
    let state = get_state();
    let caller = caller();

    if !state.is_query_caller_authorized(&id(), &caller, "get_permissions_by_permission_target") {
        trap("Access denied");
    }

    let ids = state
        .permissions
        .get_permission_ids_by_permission_target_cloned(&req.target);

    GetPermissionsByPermissionTargetResponse { ids }
}

// ----------------- ROLES & PERMISSIONS --------------------------

#[update(guard = "only_self_guard")]
pub fn attach_role_to_permission(req: AttachRoleToPermissionRequest) {
    let state = get_state();

    state
        .attach_role_to_permission(req.role_id, req.permission_id)
        .expect("Unable to attach a role to a permission");
}

#[update(guard = "only_self_guard")]
pub fn detach_role_from_permission(req: DetachRoleFromPermissionRequest) {
    let state = get_state();

    state
        .detach_role_from_permission(req.role_id, req.permission_id)
        .expect("Unable to detach a role from a permission");
}

#[query]
pub fn get_roles_attached_to_permissions(
    req: GetRolesAttachedToPermissionsRequest,
) -> GetRolesAttachedToPermissionsResponse {
    let state = get_state();
    let caller = caller();

    if !state.is_query_caller_authorized(&id(), &caller, "get_roles_attached_to_permissions") {
        trap("Access denied");
    }

    let mut result = vec![];

    for id in &req.permission_ids {
        let roles_of_permission = state.get_role_ids_of_permission_cloned(id);
        result.push((*id, roles_of_permission));
    }

    GetRolesAttachedToPermissionsResponse { result }
}

#[query]
pub fn get_permissions_attached_to_roles(
    req: GetPermissionsAttachedToRolesRequest,
) -> GetPermissionsAttachedToRolesResponse {
    let state = get_state();
    let caller = caller();

    if !state.is_query_caller_authorized(&id(), &caller, "get_permissions_attached_to_roles") {
        trap("Access denied");
    }

    let mut result = vec![];

    for id in &req.role_ids {
        let permissions_of_role = state.get_permission_ids_of_role_cloned(id);
        result.push((*id, permissions_of_role));
    }

    GetPermissionsAttachedToRolesResponse { result }
}

#[query]
fn export_candid() -> String {
    include_str!("../can.did").to_string()
}

static mut STATE: Option<State> = None;

pub fn get_state() -> &'static mut State {
    unsafe { STATE.as_mut().unwrap() }
}

#[init]
fn init(wallet_creator: Principal, gateway: Principal) {
    let state = State::new(wallet_creator, gateway).expect("Unable to create state");

    unsafe {
        STATE = Some(state);
    }
}

#[pre_upgrade]
fn pre_upgrade_hook() {
    let wallet_state = unsafe { STATE.take() };

    stable_save((wallet_state,)).expect("Unable to execute pre-upgrade");
}

#[post_upgrade]
fn post_upgrade_hook() {
    let (wallet_state,): (Option<State>,) =
        stable_restore().expect("Unable to execute post-upgrade");

    unsafe { STATE = wallet_state };
}

// ------------------ STREAMING ---------------------

// TODO need use standart certified_assets API.
// TODO Need open PR for making methods public to cdk-rs/certified_assets and use them here
#[query]
fn get_batches() -> GetBatchesResponse {
    let state = get_state();

    if !state.is_query_caller_authorized(&id(), &caller(), "get_batches") {
        trap("Access denied");
    }

    let batches = state
        .streaming
        .get_batches()
        .expect("Unable to get batches");

    GetBatchesResponse { batches }
}

#[query]
fn get_chunk(req: GetChunkRequest) -> GetChunkResponse {
    let chunk_content = ByteBuf::from(
        get_state()
            .streaming
            .get_chunk(&req.chunk_id)
            .expect("Unable to get chunk")
            .content
            .as_ref(),
    );

    GetChunkResponse { chunk_content }
}

#[update]
fn create_batch(req: CreateBatchRequest) -> CreateBatchResponse {
    let state = get_state();

    if !state.is_query_caller_authorized(&id(), &caller(), "create_batch") {
        trap("Access denied");
    }

    let batch_id = state.streaming.create_batch(req.key, req.content_type);

    CreateBatchResponse { batch_id }
}

#[update]
fn create_chunk(req: CreateChunkRequest) -> CreateChunkResponse {
    let state = get_state();

    if !state.is_query_caller_authorized(&id(), &caller(), "create_chunk") {
        trap("Access denied");
    }

    let chunk_id = state
        .streaming
        .create_chunk(req.batch_id, req.content)
        .expect("Unable to create chunk");

    CreateChunkResponse { chunk_id }
}

#[update]
fn lock_batches(req: LockBatchesRequest) {
    let state = get_state();

    if !state.is_query_caller_authorized(&id(), &caller(), "lock_batches") {
        trap("Access denied");
    }

    for batch_id in &req.batch_ids {
        state
            .streaming
            .lock_batch(batch_id)
            .expect("Unable to lock batches");
    }
}

#[update]
fn delete_unlocked_batches(req: DeleteBatchesRequest) {
    let state = get_state();

    if !state.is_query_caller_authorized(&id(), &caller(), "delete_unlocked_batches") {
        trap("Access denied");
    }

    for batch_id in &req.batch_ids {
        state
            .streaming
            .delete_batch(batch_id, false)
            .expect("Unable to delete unlocked batches");
    }
}

#[update(guard = "only_self_guard")]
fn delete_batches(req: DeleteBatchesRequest) {
    let state = get_state();

    for batch_id in &req.batch_ids {
        state
            .streaming
            .delete_batch(batch_id, true)
            .expect("Unable to delete batches");
    }
}

#[update(guard = "only_self_guard")]
async fn send_batch(req: SendBatchRequest) {
    let batch = get_state()
        .streaming
        .get_batch(&req.batch_id)
        .expect("Unable to send batch")
        .clone();

    if !batch.locked {
        trap("Batch is not locked!");
    }

    let (resp,) = req
        .target_canister
        .create_batch()
        .await
        .to_candid_type()
        .expect("Unable to create batch at remote canister");

    let mut target_chunk_ids = vec![];

    for chunk_id in &batch.chunk_ids {
        let chunk_content = ByteBuf::from(
            get_state()
                .streaming
                .get_chunk(chunk_id)
                .expect("Unable to send batch")
                .content
                .as_ref(),
        );

        let res = req
            .target_canister
            .create_chunk(CreateChunkRequest {
                batch_id: resp.batch_id.clone(),
                content: chunk_content,
            })
            .await
            .to_candid_type();

        match res {
            Err(e) => {
                req.target_canister
                    .commit_batch(CommitBatchArguments {
                        batch_id: resp.batch_id.clone(),
                        operations: vec![
                            BatchOperation::CreateAsset(CreateAssetArguments {
                                key: String::from("$$$.failed"),
                                content_type: String::from("text/plain"),
                            }),
                            BatchOperation::SetAssetContent(SetAssetContentArguments {
                                key: String::from("$$$.failed"),
                                content_encoding: String::from("identity"),
                                chunk_ids: target_chunk_ids,
                                sha256: None,
                            }),
                            BatchOperation::DeleteAsset(DeleteAssetArguments {
                                key: String::from("$$$.failed"),
                            }),
                        ],
                    })
                    .await
                    .unwrap_or_else(|_| {
                        panic!(
                            "[FATAL] Unable to cleanup after chunk creation error {:?}",
                            e
                        )
                    });

                panic!("Unable to create chunk: {:?}", e);
            }
            Ok((response,)) => target_chunk_ids.push(response.chunk_id),
        }
    }

    req.target_canister
        .commit_batch(CommitBatchArguments {
            batch_id: resp.batch_id,
            operations: vec![
                BatchOperation::CreateAsset(CreateAssetArguments {
                    key: batch.key.clone(),
                    content_type: batch.content_type,
                }),
                BatchOperation::SetAssetContent(SetAssetContentArguments {
                    key: batch.key,
                    content_encoding: String::from("identity"),
                    chunk_ids: target_chunk_ids,
                    sha256: None,
                }),
            ],
        })
        .await
        .expect("Unable to commit batch");
}

// --------------------------- INFO ------------------------

#[update(guard = "only_self_guard")]
fn update_info(req: UpdateInfoRequest) {
    get_state().set_info(req.new_info);
}

#[query]
fn get_info() -> GetInfoResponse {
    let info = get_state().get_info().clone();

    GetInfoResponse { info }
}
*/
