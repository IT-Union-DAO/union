use crate::repository::streaming::types::{
    Batch, BatchId, Chunk, ChunkId, Key, StreamingRepositoryError,
};
use candid::{CandidType, Deserialize};
use serde_bytes::ByteBuf;
use std::collections::HashMap;
use shared::pageable::{Page, PageRequest, Pageable};

pub mod types;

#[derive(Default, CandidType, Deserialize)]
pub struct StreamingRepository {
    chunks: HashMap<ChunkId, Chunk>,
    batches: HashMap<BatchId, Batch>,

    chunk_id_counter: ChunkId,
    batch_id_counter: BatchId,
}

impl StreamingRepository {
    #[inline(always)]
    pub fn create_batch(&mut self, key: Key, content_type: String) -> BatchId {
        let id = self.generate_batch_id();
        let batch = Batch::new(key, content_type);
        
        self.batches.insert(id.clone(), batch);

        id
    }

    pub fn create_chunk(
        &mut self,
        batch_id: BatchId,
        content: ByteBuf,
    ) -> Result<ChunkId, StreamingRepositoryError> {
        let chunk_id = self.generate_chunk_id();

        let batch = self.get_batch_mut(&batch_id)?;
        batch.add_chunk(batch_id.clone(), chunk_id.clone());
        
        let chunk = Chunk::new(batch_id, content);
        self.chunks.insert(chunk_id.clone(), chunk);

        Ok(chunk_id)
    }

    #[inline(always)]
    pub fn lock_batch(&mut self, batch_id: BatchId) -> Result<(), StreamingRepositoryError> {
        let batch = self.get_batch_mut(&batch_id)?;
        batch.lock(batch_id)
    }

    pub fn delete_batch(
        &mut self,
        batch_id: &BatchId,
        lock_assertion: bool,
    ) -> Result<(), StreamingRepositoryError> {
        let batch = self.get_batch(batch_id)?;
        assert_eq!(batch.locked, lock_assertion, "Invalid batch lock state");

        let batch = self.batches.remove(batch_id).unwrap();

        for chunk_id in &batch.chunk_ids {
            self.chunks.remove(chunk_id).unwrap();
        }

        Ok(())
    }

    pub fn get_batch(&self, batch_id: &BatchId) -> Result<&Batch, StreamingRepositoryError> {
        self.batches
            .get(batch_id)
            .ok_or_else(|| StreamingRepositoryError::BatchNotFound(batch_id.clone()))
    }

    pub fn get_batch_mut(&mut self, batch_id: &BatchId) -> Result<&mut Batch, StreamingRepositoryError> {
        self.batches
            .get_mut(batch_id)
            .ok_or_else(|| StreamingRepositoryError::BatchNotFound(batch_id.clone()))
    }

    pub fn get_batches_cloned(&self, page_req: PageRequest<(), ()>) -> Page<(BatchId, Batch)> {
        let (has_next, iter) = self.batches.iter().get_page(&page_req);
        let data = iter.map(|(key, value)| (key.clone(), value.clone())).collect();
        
        Page {
            has_next,
            data,
        }
    }

    pub fn get_chunk(&self, chunk_id: &ChunkId) -> Result<&Chunk, StreamingRepositoryError> {
        self.chunks
            .get(chunk_id)
            .ok_or_else(|| StreamingRepositoryError::ChunkNotFound(chunk_id.clone()))
    }

    fn generate_chunk_id(&mut self) -> ChunkId {
        let id = self.chunk_id_counter.clone();
        self.chunk_id_counter += 1;

        id
    }

    fn generate_batch_id(&mut self) -> BatchId {
        let id = self.batch_id_counter.clone();
        self.batch_id_counter += 1;

        id
    }
}
