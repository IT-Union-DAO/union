use ic_cdk::api::call::{CallResult, RejectionCode};
use ic_cdk::export::candid::{CandidType, Deserialize};

#[derive(CandidType, Deserialize, Debug, Clone)]
pub enum CandidRejectionCode {
    NoError,

    SysFatal,
    SysTransient,
    DestinationInvalid,
    CanisterReject,
    CanisterError,

    Unknown,
}

impl CandidRejectionCode {
    pub fn from_common(rej_code: RejectionCode) -> Self {
        match rej_code {
            RejectionCode::NoError => Self::NoError,
            RejectionCode::SysFatal => Self::SysFatal,
            RejectionCode::SysTransient => Self::SysTransient,
            RejectionCode::DestinationInvalid => Self::DestinationInvalid,
            RejectionCode::CanisterReject => Self::CanisterReject,
            RejectionCode::CanisterError => Self::CanisterError,
            RejectionCode::Unknown => Self::Unknown,
        }
    }
}

pub type CandidCallResult<T> = Result<T, (CandidRejectionCode, String)>;

pub trait ToCandidType<T: CandidType> {
    fn to_candid_type(self) -> T;
}

impl<T: CandidType> ToCandidType<CandidCallResult<T>> for CallResult<T> {
    fn to_candid_type(self) -> Result<T, (CandidRejectionCode, String)> {
        match self {
            Ok(t) => Ok(t),
            Err((rej_code, string)) => Err((CandidRejectionCode::from_common(rej_code), string)),
        }
    }
}

#[derive(CandidType, Deserialize, Debug, Clone)]
pub struct ValidationError(String);

pub fn validate_and_trim_str(
    string: String,
    min: usize,
    max: usize,
    name: &str,
) -> Result<String, ValidationError> {
    if min > max {
        unreachable!("Min should never be more than max");
    }

    let trimmed = string.trim();
    let trimmed_len = trimmed.len();

    if trimmed_len > max {
        Err(ValidationError(
            format!(
                "{} can't be longer than {} symbols ({})",
                name, max, trimmed_len
            )
            .to_string(),
        ))
    } else if trimmed_len < min {
        Err(ValidationError(
            format!(
                "{} can't be shorter than {} symbols ({})",
                name, min, trimmed_len
            )
            .to_string(),
        ))
    } else {
        Ok(trimmed.to_string())
    }
}

macro_rules! gen_validate_num {
    ($func:ident, $typ:ident) => {
        pub fn $func(
            number: $typ,
            min: $typ,
            max: $typ,
            name: &str,
        ) -> Result<(), ValidationError> {
            if min > max {
                unreachable!("Min should never be more than max");
            }

            if number > max {
                Err(ValidationError(
                    format!("{} can't be bigger than {} ({})", name, max, number).to_string(),
                ))
            } else if number < min {
                Err(ValidationError(
                    format!("{} can't be smaller than {} ({})", name, min, number).to_string(),
                ))
            } else {
                Ok(())
            }
        }
    };
}

gen_validate_num!(validate_u16, u16);
gen_validate_num!(validate_f32, f32);
