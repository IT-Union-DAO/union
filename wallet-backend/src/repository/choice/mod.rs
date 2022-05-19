use crate::repository::choice::model::Choice;
use crate::repository::choice::types::ChoiceFilter;
use candid::{CandidType, Deserialize};
use shared::mvc::{IdGenerator, Model, Repository};
use shared::pageable::{Page, PageRequest, Pageable};
use shared::types::wallet::{ChoiceId, VotingId};
use std::collections::{BTreeMap, BTreeSet, HashMap};
use crate::repository::nested_voting::types::{NestedVotingId, RemoteVotingId};

pub mod model;
pub mod types;

#[derive(Default, CandidType, Deserialize)]
pub struct ChoiceRepository {
    choices: HashMap<ChoiceId, Choice>,
    id_gen: IdGenerator,

    choices_by_voting_index: BTreeMap<VotingId, BTreeSet<ChoiceId>>,
    choices_by_nested_voting_index: BTreeMap<NestedVotingId, BTreeSet<ChoiceId>>,
}

impl Repository<Choice, ChoiceId, ChoiceFilter, ()> for ChoiceRepository {
    fn save(&mut self, mut it: Choice) -> ChoiceId {
        if it.is_transient() {
            it._init_id(self.id_gen.generate());
        }

        let id = it.get_id().unwrap();
        
        match it.get_voting_id() {
            RemoteVotingId::Common(voting_id) => {
                self.choices_by_voting_index
                    .entry(voting_id)
                    .or_default()
                    .insert(id);
            },
            RemoteVotingId::Nested(voting_id) => {
                self.choices_by_nested_voting_index
                    .entry(voting_id)
                    .or_default()
                    .insert(id);
            }
        }
        
        self.choices.insert(id, it);

        id
    }

    fn delete(&mut self, id: &ChoiceId) -> Option<Choice> {
        let it = self.choices.remove(id)?;
        
        match it.get_voting_id() {
            RemoteVotingId::Common(voting_id) => {
                self.choices_by_voting_index
                    .get_mut(&voting_id)
                    .unwrap()
                    .remove(id);
            },
            RemoteVotingId::Nested(voting_id) => {
                self.choices_by_nested_voting_index
                    .get_mut(&voting_id)
                    .unwrap()
                    .remove(id);
            }
        }

        Some(it)
    }

    fn get(&self, id: &ChoiceId) -> Option<Choice> {
        self.choices.get(id).cloned()
    }

    fn list(&self, page_req: &PageRequest<ChoiceFilter, ()>) -> Page<Choice> {
        let ids_opt = match page_req.filter.voting_id {
            RemoteVotingId::Common(id) => {
                self.choices_by_voting_index.get(&id)
            },
            RemoteVotingId::Nested(id) => {
                self.choices_by_nested_voting_index.get(&id)
            }
        };
        
        match ids_opt {
            Some(ids) => {
                let (has_next, iter) = ids.iter().get_page(page_req);
                let data = iter.map(|id| self.get(id).unwrap()).collect();

                Page::new(data, has_next)
            }
            None => Page::empty(),
        }
    }
}
