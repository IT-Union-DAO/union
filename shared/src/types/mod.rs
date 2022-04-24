use std::alloc::{alloc_zeroed, Layout};
use std::mem::size_of;

pub mod history_ledger;
pub mod wallet;

pub type Blob = Vec<u8>;

// TODO: check these for memory leaks

pub trait IntoBlob {
    fn into(self) -> Blob;
}

impl<T: Copy> IntoBlob for T {
    fn into(self) -> Blob {
        let p = unsafe {
            std::slice::from_raw_parts((&self as *const Self) as *const u8, size_of::<Self>())
        };

        Vec::from(p)
    }
}

pub trait FromBlob {
    fn from(it: &Blob) -> Self;
}

impl<T: Copy> FromBlob for T {
    fn from(it: &Blob) -> Self {
        assert_eq!(it.len(), size_of::<Self>());

        let layout = Layout::from_size_align(size_of::<Self>(), size_of::<Self>()).unwrap();

        unsafe {
            let ptr = alloc_zeroed(layout);
            it.as_ptr().copy_to(ptr, size_of::<Self>());

            (ptr as *mut Self).read()
        }
    }
}
