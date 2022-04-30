use crate::repository::choice::types::{
    VOTING_CHOICE_DESCRIPTION_MAX_LEN, VOTING_CHOICE_DESCRIPTION_MIN_LEN,
    VOTING_CHOICE_NAME_MAX_LEN, VOTING_CHOICE_NAME_MIN_LEN,
};
use crate::repository::token::types::TokenId;
use candid::{CandidType, Deserialize};
use shared::mvc::Model;
use shared::remote_call::Program;
use shared::types::wallet::{ChoiceId, GroupOrProfile, VotingId};
use shared::validation::{validate_and_trim_str, ValidationError};
use std::collections::BTreeMap;

#[derive(Clone, CandidType, Deserialize)]
pub struct Choice {
    id: Option<ChoiceId>,
    voting_id: VotingId,
    name: String,
    description: String,
    program: Program,
    voting_power_by_gop: BTreeMap<GroupOrProfile, TokenId>,
}

impl Choice {
    pub fn new(
        name: String,
        description: String,
        program: Program,
        voting_id: VotingId,
    ) -> Result<Self, ValidationError> {
        Ok(Self {
            id: None,
            voting_id,
            name: Self::process_name(name)?,
            description: Self::process_description(description)?,
            program,
            voting_power_by_gop: BTreeMap::new(),
        })
    }

    pub fn new_rejection(voting_id: VotingId) -> Self {
        Self::new(
            String::from("Reject"),
            String::from("I don't support this voting"),
            Program::Empty,
            voting_id,
        )
        .unwrap()
    }

    pub fn new_approval(voting_id: VotingId) -> Self {
        Self::new(
            String::from("Approve"),
            String::from("This voting makes sense to me"),
            Program::Empty,
            voting_id,
        )
        .unwrap()
    }

    pub fn update(
        &mut self,
        new_name: Option<String>,
        new_description: Option<String>,
        new_program: Option<Program>,
    ) -> Result<(), ValidationError> {
        if let Some(name) = new_name {
            self.name = Self::process_name(name)?;
        }

        if let Some(description) = new_description {
            self.description = Self::process_description(description)?;
        }

        if let Some(program) = new_program {
            self.program = program;
        }

        Ok(())
    }

    pub fn set_shares_by_gop_token(&mut self, gop: GroupOrProfile, token_id: TokenId) {
        assert!(!self.voting_power_by_gop.contains_key(&gop));
        self.voting_power_by_gop.insert(gop, token_id);
    }

    pub fn get_shares_by_gop_token(&self, gop: &GroupOrProfile) -> Option<&TokenId> {
        self.voting_power_by_gop.get(gop)
    }

    pub fn list_tokens_by_gop(&self) -> &BTreeMap<GroupOrProfile, TokenId> {
        &self.voting_power_by_gop
    }

    pub fn get_voting_id(&self) -> &VotingId {
        &self.voting_id
    }

    pub fn get_program(&self) -> &Program {
        &self.program
    }

    fn process_name(name: String) -> Result<String, ValidationError> {
        validate_and_trim_str(
            name,
            VOTING_CHOICE_NAME_MIN_LEN,
            VOTING_CHOICE_NAME_MAX_LEN,
            "Choice name",
        )
    }

    fn process_description(description: String) -> Result<String, ValidationError> {
        validate_and_trim_str(
            description,
            VOTING_CHOICE_DESCRIPTION_MIN_LEN,
            VOTING_CHOICE_DESCRIPTION_MAX_LEN,
            "Choice description",
        )
    }
}

impl Model<ChoiceId> for Choice {
    fn get_id(&self) -> Option<ChoiceId> {
        self.id
    }

    fn _init_id(&mut self, id: ChoiceId) {
        assert!(self.is_transient());
        self.id = Some(id);
    }

    fn is_transient(&self) -> bool {
        self.id.is_none()
    }
}
