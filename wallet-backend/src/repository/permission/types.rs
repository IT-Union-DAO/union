use ic_cdk::export::candid::{CandidType, Deserialize, Principal};
use shared::remote_call::{Program, RemoteCallEndpoint};
use std::collections::BTreeSet;
use shared::mvc::Id;
use shared::validation::{validate_and_trim_str, ValidationError};

pub const PERMISSION_NAME_MIN_LEN: usize = 1;
pub const PERMISSION_NAME_MAX_LEN: usize = 100;
pub const PERMISSION_DESCRIPTION_MIN_LEN: usize = 0;
pub const PERMISSION_DESCRIPTION_MAX_LEN: usize = 300;

pub type PermissionId = Id;

#[derive(CandidType, Deserialize, Copy, Clone, Debug)]
pub enum PermissionScope {
    Whitelist,
    Blacklist,
}

#[derive(CandidType, Deserialize, Clone, PartialEq, Ord, PartialOrd, Eq, Hash, Debug)]
pub enum PermissionTarget {
    SelfEmptyProgram,
    Canister(Principal),
    Endpoint(RemoteCallEndpoint),
}

impl PermissionTarget {
    pub fn to_canister(self) -> Option<PermissionTarget> {
        match &self {
            PermissionTarget::SelfEmptyProgram => None,
            PermissionTarget::Canister(_) => Some(self),
            PermissionTarget::Endpoint(e) => Some(PermissionTarget::Canister(e.canister_id)),
        }
    }
}

#[derive(CandidType, Deserialize)]
pub struct PermissionFilter {
    pub target: Option<PermissionTarget>,
}