use crate::repository::permission::types::PermissionId;
use crate::repository::voting_config::types::{
    LenInterval, RoundSettings, ThresholdValue, VOTING_CONFIG_DESCRIPTION_MAX_LEN,
    VOTING_CONFIG_DESCRIPTION_MIN_LEN, VOTING_CONFIG_NAME_MAX_LEN, VOTING_CONFIG_NAME_MIN_LEN,
};
use candid::{CandidType, Deserialize};
use shared::mvc::Model;
use shared::types::wallet::VotingConfigId;
use shared::validation::{validate_and_trim_str, ValidationError};
use std::collections::BTreeSet;

#[derive(Clone, CandidType, Deserialize)]
pub struct VotingConfig {
    id: Option<VotingConfigId>,
    name: String,
    description: String,

    choices_count: Option<LenInterval>,
    winners_count: Option<LenInterval>,
    round: RoundSettings,

    permissions: BTreeSet<PermissionId>,

    approval: ThresholdValue,
    rejection: ThresholdValue,
    quorum: ThresholdValue,
    win: ThresholdValue,
    next_round: ThresholdValue,
}

impl VotingConfig {
    pub fn new(
        name: String,
        description: String,
        choices_count: Option<LenInterval>,
        winners_count: Option<LenInterval>,
        permissions: BTreeSet<PermissionId>,
        round: RoundSettings,
        approval: ThresholdValue,
        quorum: ThresholdValue,
        rejection: ThresholdValue,
        win: ThresholdValue,
        next_round: ThresholdValue,
    ) -> Result<VotingConfig, ValidationError> {
        if let Some(cc) = &choices_count {
            if !cc.is_valid() {
                return Err(ValidationError(
                    "Invalid choices count interval".to_string(),
                ));
            }
        }

        if let Some(wc) = &winners_count {
            if !wc.is_valid() {
                return Err(ValidationError(
                    "Invalid winners count interval".to_string(),
                ));
            }
        }

        let voting_config = VotingConfig {
            id: None,
            name: Self::process_name(name)?,
            description: Self::process_description(description)?,
            choices_count,
            winners_count,
            permissions,
            round,
            approval,
            quorum,
            rejection,
            win,
            next_round,
        };

        Ok(voting_config)
    }

    pub fn update(
        &mut self,
        name_opt: Option<String>,
        description_opt: Option<String>,
        choices_count_opt: Option<Option<LenInterval>>,
        winners_count_opt: Option<Option<LenInterval>>,
        permissions_opt: Option<BTreeSet<PermissionId>>,
        round_opt: Option<RoundSettings>,
        approval_opt: Option<ThresholdValue>,
        quorum_opt: Option<ThresholdValue>,
        rejection_opt: Option<ThresholdValue>,
        win_opt: Option<ThresholdValue>,
        next_round_opt: Option<ThresholdValue>,
    ) -> Result<(), ValidationError> {
        if let Some(name) = name_opt {
            self.name = Self::process_name(name)?;
        }

        if let Some(description) = description_opt {
            self.description = Self::process_description(description)?;
        }

        if let Some(choices_count) = choices_count_opt {
            if let Some(cc) = &choices_count {
                if !cc.is_valid() {
                    return Err(ValidationError(
                        "Invalid choices count interval".to_string(),
                    ));
                }
            }

            self.choices_count = choices_count;
        }

        if let Some(winners_count) = winners_count_opt {
            if let Some(wc) = &winners_count {
                if !wc.is_valid() {
                    return Err(ValidationError(
                        "Invalid winners count interval".to_string(),
                    ));
                }
            }

            self.winners_count = winners_count;
        }

        if let Some(permissions) = permissions_opt {
            self.permissions = permissions;
        }

        if let Some(round) = round_opt {
            self.round = round;
        }

        if let Some(approval) = approval_opt {
            self.approval = approval;
        }

        if let Some(quorum) = quorum_opt {
            self.quorum = quorum;
        }

        if let Some(rejection) = rejection_opt {
            self.rejection = rejection;
        }

        if let Some(win) = win_opt {
            self.win = win;
        }

        if let Some(next_round) = next_round_opt {
            self.next_round = next_round;
        }

        Ok(())
    }

    pub fn get_round_settings(&self) -> &RoundSettings {
        &self.round
    }

    pub fn get_winners_count(&self) -> &Option<LenInterval> {
        &self.winners_count
    }

    pub fn get_choices_count(&self) -> &Option<LenInterval> {
        &self.choices_count
    }

    pub fn get_permissions(&self) -> &BTreeSet<PermissionId> {
        &self.permissions
    }

    pub fn get_approval_threshold(&self) -> &ThresholdValue {
        &self.approval
    }

    pub fn get_rejection_threshold(&self) -> &ThresholdValue {
        &self.rejection
    }

    pub fn get_quorum_threshold(&self) -> &ThresholdValue {
        &self.quorum
    }

    pub fn get_win_threshold(&self) -> &ThresholdValue {
        &self.win
    }

    pub fn get_next_round_threshold(&self) -> &ThresholdValue {
        &self.next_round
    }

    fn process_name(name: String) -> Result<String, ValidationError> {
        validate_and_trim_str(
            name,
            VOTING_CONFIG_NAME_MIN_LEN,
            VOTING_CONFIG_NAME_MAX_LEN,
            "Voting config name",
        )
    }

    fn process_description(description: String) -> Result<String, ValidationError> {
        validate_and_trim_str(
            description,
            VOTING_CONFIG_DESCRIPTION_MIN_LEN,
            VOTING_CONFIG_DESCRIPTION_MAX_LEN,
            "Voting config description",
        )
    }
}

impl Model<VotingConfigId> for VotingConfig {
    fn get_id(&self) -> Option<VotingConfigId> {
        self.id
    }

    fn _init_id(&mut self, id: VotingConfigId) {
        assert!(self.is_transient());
        self.id = Some(id);
    }

    fn is_transient(&self) -> bool {
        self.id.is_none()
    }
}
