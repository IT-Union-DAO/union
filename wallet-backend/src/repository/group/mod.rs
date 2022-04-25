use crate::repository::group::model::Group;
use crate::repository::group::types::GroupType;
use candid::{CandidType, Deserialize, Principal};
use shared::mvc::{IdGenerator, Model, Repository};
use shared::pageable::{Page, PageRequest, Pageable};
use shared::types::wallet::{GroupId, ProfileId, Shares};
use std::collections::hash_map::Entry;
use std::collections::{BTreeSet, HashMap};

pub mod model;
pub mod types;

#[derive(Default, CandidType, Deserialize)]
pub struct GroupRepository {
    groups: HashMap<GroupId, Group>,
    id_gen: IdGenerator,
}

impl Repository<Group, GroupId, (), ()> for GroupRepository {
    fn save(&mut self, mut it: Group) {
        if it.is_transient() {
            it._init_id(self.id_gen.generate());
        }

        self.groups.insert(it.get_id().unwrap(), it);
    }

    fn delete(&mut self, id: &GroupId) -> Option<Group> {
        self.groups.remove(id)
    }

    fn get(&self, id: &GroupId) -> Option<Group> {
        self.groups.get(id).cloned()
    }

    fn list(&self, page_req: &PageRequest<(), ()>) -> Page<Group> {
        let (has_next, iter) = self.groups.iter().get_page(page_req);
        let data = iter.map(|(_, group)| group.clone()).collect();

        Page::new(data, has_next)
    }
}
