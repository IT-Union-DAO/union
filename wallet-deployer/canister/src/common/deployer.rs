use crate::common::types::{
    Blob, DeployerError, UnionWalletBinary, UnionWalletBinaryStatus, UnionWalletInstance,
};
use crate::common::utils::validate_and_trim_str;
use ic_cdk::export::candid::{CandidType, Deserialize, Principal};
use std::collections::hash_map::Entry;
use std::collections::HashMap;

#[derive(Default, CandidType, Deserialize)]
pub struct State {
    pub instances: HashMap<Principal, UnionWalletInstance>,
    pub binaries: HashMap<String, UnionWalletBinary>,
    pub latest_version: Option<String>,
}

impl State {
    pub fn create_binary_version(
        &mut self,
        mut version: String,
        mut description: String,
        timestamp: u64,
    ) -> Result<(), DeployerError> {
        version = validate_and_trim_str(version, 5, 30, "Version")
            .map_err(DeployerError::ValidationError)?;

        description = validate_and_trim_str(description, 10, 5000, "Description")
            .map_err(DeployerError::ValidationError)?;

        if self.binaries.contains_key(&version) {
            return Err(DeployerError::BinaryVersionAlreadyExists);
        }

        let binary_version = UnionWalletBinary::new(version.clone(), description, timestamp);

        self.binaries.insert(version, binary_version);

        Ok(())
    }

    pub fn update_binary_version_description(
        &mut self,
        version: &str,
        new_description: Option<String>,
        timestamp: u64,
    ) -> Result<(), DeployerError> {
        let binary_version = self
            .binaries
            .get_mut(version)
            .ok_or(DeployerError::BinaryVersionNotFound)?;

        if let Some(mut new_description) = new_description {
            new_description = validate_and_trim_str(new_description, 10, 5000, "Description")
                .map_err(DeployerError::ValidationError)?;

            binary_version.description = new_description;
        }

        binary_version.updated_at = timestamp;

        Ok(())
    }

    pub fn release_binary_version(
        &mut self,
        version: &str,
        timestamp: u64,
    ) -> Result<(), DeployerError> {
        let binary_version = self
            .binaries
            .get_mut(version)
            .ok_or(DeployerError::BinaryVersionNotFound)?;

        match binary_version.status {
            UnionWalletBinaryStatus::Created => {
                if binary_version.binary.is_none() {
                    return Err(DeployerError::MissingBinary);
                }

                binary_version.status = UnionWalletBinaryStatus::Released;
                binary_version.updated_at = timestamp;
                self.latest_version = Some(String::from(version));

                Ok(())
            }
            _ => Err(DeployerError::BinaryVersionHasWrongStatus),
        }
    }

    pub fn delete_binary_version(
        &mut self,
        version: &str,
        timestamp: u64,
    ) -> Result<(), DeployerError> {
        let binary_version = self
            .binaries
            .get_mut(version)
            .ok_or(DeployerError::BinaryVersionNotFound)?;

        match binary_version.status {
            UnionWalletBinaryStatus::Deleted => Err(DeployerError::BinaryVersionHasWrongStatus),
            _ => {
                if let Some(latest) = &self.latest_version {
                    if latest == version {
                        return Err(DeployerError::UnableToDeleteLatestVersion);
                    }
                }

                binary_version.status = UnionWalletBinaryStatus::Deleted;
                binary_version.updated_at = timestamp;
                binary_version.binary = None;

                Ok(())
            }
        }
    }

    pub fn upload_binary(
        &mut self,
        version: &str,
        binary: Blob,
        timestamp: u64,
    ) -> Result<(), DeployerError> {
        let binary_version = self
            .binaries
            .get_mut(version)
            .ok_or(DeployerError::BinaryVersionNotFound)?;

        match binary_version.binary {
            None => {
                binary_version.binary = Some(binary);
                binary_version.updated_at = timestamp;

                Ok(())
            }
            Some(_) => Err(DeployerError::BinaryIsImmutable),
        }
    }

    pub fn get_binary_versions(&self) -> Vec<String> {
        self.binaries.keys().cloned().into_iter().collect()
    }

    pub fn get_binary_version(&self, version: &str) -> Result<UnionWalletBinary, DeployerError> {
        let binary_version = self
            .binaries
            .get(version)
            .ok_or(DeployerError::BinaryVersionNotFound)?;

        Ok(UnionWalletBinary {
            version: binary_version.version.clone(),
            description: binary_version.description.clone(),
            status: binary_version.status,
            binary: if binary_version.binary.is_some() {
                Some(Vec::new())
            } else {
                None
            },
            created_at: binary_version.created_at,
            updated_at: binary_version.updated_at,
        })
    }

    pub fn download_binary(&self, version: &str) -> Result<Option<Blob>, DeployerError> {
        let binary_version = self
            .binaries
            .get(version)
            .ok_or(DeployerError::BinaryVersionNotFound)?;

        Ok(binary_version.binary.clone())
    }

    pub fn set_instance_version(
        &mut self,
        instance_id: Principal,
        version: String,
        timestamp: u64,
    ) {
        match self.instances.entry(instance_id) {
            Entry::Occupied(mut e) => {
                let instance = e.get_mut();

                instance.binary_version = version;
                instance.upgraded_at = timestamp;
            }
            Entry::Vacant(e) => {
                let instance = UnionWalletInstance {
                    binary_version: version,
                    canister_id: instance_id,
                    created_at: timestamp,
                    upgraded_at: timestamp,
                };

                e.insert(instance);
            }
        }
    }

    pub fn get_instance_ids(&self) -> Vec<Principal> {
        self.instances.keys().cloned().collect()
    }

    pub fn get_instance(
        &self,
        instance_id: &Principal,
    ) -> Result<UnionWalletInstance, DeployerError> {
        self.instances
            .get(instance_id)
            .cloned()
            .ok_or(DeployerError::InstanceNotFound)
    }
}
