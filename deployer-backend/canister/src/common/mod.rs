pub mod deployer;
pub mod guards;
pub mod types;
pub mod utils;

use crate::common::utils::ToCandidType;
use ic_cdk::export::candid::Principal;
use shared::candid::Blob;
use shared::management_canister_client::{
    CanisterInstallMode, CanisterSettings, CreateCanisterRequest, IManagementCanisterClient,
    InstallCodeRequest, UpdateSettingsRequest,
};

pub async fn deploy_canister_install_code_update_settings(
    this: Principal,
    args_raw: Blob,
    wasm: Blob,
    cycles: u64,
) -> Principal {
    let management_canister = Principal::management_canister();

    let (resp,) = management_canister
        .create_canister(CreateCanisterRequest { settings: None }, cycles)
        .await
        .to_candid_type()
        .expect("Unable to create canister");

    management_canister
        .install_code(InstallCodeRequest {
            wasm_module: wasm,
            canister_id: resp.canister_id,
            mode: CanisterInstallMode::install,
            arg: args_raw,
        })
        .await
        .to_candid_type()
        .expect("Unable to install code");

    management_canister
        .update_settings(UpdateSettingsRequest {
            canister_id: resp.canister_id,
            settings: CanisterSettings {
                controllers: vec![this],
            },
        })
        .await
        .to_candid_type()
        .expect("Unable to update settings");

    resp.canister_id
}

pub async fn upgrade_canister(canister_id: Principal, wasm: Blob) {
    Principal::management_canister()
        .install_code(InstallCodeRequest {
            wasm_module: wasm,
            canister_id,
            mode: CanisterInstallMode::upgrade,
            arg: vec![],
        })
        .await
        .to_candid_type()
        .expect("Unable to install code");
}
