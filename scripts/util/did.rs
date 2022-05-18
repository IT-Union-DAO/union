
use clap::{Parser};
use std::io::{Write};
use candid::{IDLArgs, types::Label, parser::value::IDLValue};
use std::fs;
use crate::utils;

#[derive(Parser)]
#[clap(name("did"))]
pub struct CandidOpts {
	#[clap(subcommand)]
	command: Command,
}

#[derive(clap::Subcommand)]
pub enum Command {
    Encode(CandidEncodeOpts),
    Get(CandidGetOpts),
}

#[derive(Parser)]
#[clap(name("encode"))]
pub struct CandidEncodeOpts {
	argument: String,

	#[clap(long, possible_values(&["test", "check", "blob", "content", "hex"]))]
	mode: String,
	
	#[clap(long, possible_values(&["file", "string"]), default_value = "file")]
	r#type: String,
}

#[derive(Parser)]
#[clap(name("get"))]
pub struct CandidGetOpts {
	argument: String,
	selector: String,
}

pub async fn execute(opts: CandidOpts) {
	match opts.command {
			Command::Encode(v) => encode(v).await,
			Command::Get(v) => println!("{}", get(v).await),
	}
}

pub async fn encode(opts: CandidEncodeOpts) {
	let arg = opts.argument;
	let arg_type = opts.r#type;

	let hex = match opts.mode.as_str() {
		"test" => {
			String::from("Not implemented")
		},
		"check" => {
			let content = match arg_type.as_str() {
				"file" => 
					fs::read_to_string(utils::abspath(arg.as_str()).unwrap())
							.expect("Something went wrong when reading the file"),
				"string" => arg,
				_ => panic!("Wrong arg type"),
			};

			candid::pretty_parse::<IDLArgs>("Candid argument", content.as_str())
					.expect("Cannot parse argument")
					.to_bytes()
					.expect("Cannot parse argument");

			String::from("Success")
		},
		"blob" => {
			let bytes = match arg_type.as_str() {
				"file" => utils::get_file_as_byte_vec(&utils::abspath(arg.as_str()).unwrap()),
				"string" => arg.as_str().as_bytes().to_vec(),
				_ => panic!("Wrong arg type"),
			};

			let mut res = String::new();
			for ch in bytes.iter() {
					res.push_str(&candid::parser::pretty::pp_char(*ch));
			}
			res
		},
		"content" => {
			let content = match arg_type.as_str() {
				"file" => 
					fs::read_to_string(utils::abspath(arg.as_str()).unwrap())
						.expect("Something went wrong when reading the file"),
				"string" => arg,
				_ => panic!("Wrong arg type"),
			};

			let arg_string = candid::pretty_parse::<IDLArgs>("Candid argument", &content)
				.map_err(|e| format!("Invalid Candid values: {}", e))
				.unwrap()
				.to_bytes()
				.unwrap();

			let mut res = String::new();
			for ch in arg_string.iter() {
				res.push_str(&candid::parser::pretty::pp_char(*ch));
			}
			res
		},
		"hex" => {
			let content = match arg_type.as_str() {
				"file" => 
					fs::read_to_string(utils::abspath(arg.as_str()).unwrap())
						.expect("Something went wrong reading the file"),
				"string" => arg,
				_ => panic!("Wrong arg type"),
			};

			let bytes = candid::pretty_parse::<IDLArgs>("Candid argument", content.as_str())
					.expect("Cannot parse argument")
					.to_bytes()
					.expect("Cannot parse argument");

			hex::encode(bytes)
		},
		_ => String::from("Error"),
	};

	std::io::stdout().write_all(hex.as_bytes()).unwrap();
}

pub async fn get(opts: CandidGetOpts) -> String {
	let arg = opts.argument;
	let mut selectors = opts.selector.split('.');

	let bytes = candid::pretty_parse::<IDLArgs>("Candid argument", arg.as_str())
		.map_err(|e| format!("Invalid Candid values: {}", e))
		.unwrap()
		.to_bytes()
		.unwrap();

	let decoded = match IDLArgs::from_bytes(&bytes) {
		Ok(_v) => _v,
		Err(_) => panic!("Error parse bytes"),
	};

	let mut value: &IDLValue;

	let index_selector = selectors
		.next()
		.ok_or(format!("Invalid selector start index"))
		.unwrap();
	let index = index_selector.parse::<usize>()
		.ok()
		.ok_or(format!("Invalid selector start index"))
		.unwrap();

	value = &decoded.args
		.get(index)
		.ok_or(format!("Invalid first selector '{}'", index_selector))
		.unwrap();

	let mut computed_value = String::from("");

	selectors.for_each(|x| {
		match value {
			candid::parser::value::IDLValue::Record(record) => {
				let field_id = candid::idl_hash(&x);

				let found = record.iter().find(|f| match &f.id {
					Label::Id(id) => id.clone() == field_id || id.to_string() == x,
					Label::Unnamed(id) => id.clone() == field_id || id.to_string() == x,
					Label::Named(name) => x == name,
				});

				let field = found.ok_or(format!("Invalid selector {} for record '{:?}'", x, record)).unwrap();
				value = &field.val;
			},
			// TODO handle variant, null, empty
			candid::parser::value::IDLValue::Vec(vector) => {
				let index = if x.starts_with('#') {
					match x.replace('#', "").as_str() {
						"max" => {
							let elem = vector.iter().max_by(|a, b| {
								let a_num = parse_idl_number(a.to_string());
								let b_num = parse_idl_number(b.to_string());
								
								a_num.cmp(&b_num)
							}).unwrap();

							vector.iter().position(|r| r == elem).unwrap()
						},
						"min" => {
							let elem = vector.iter().min_by(|a, b| {
								let a_num = parse_idl_number(a.to_string());
								let b_num = parse_idl_number(b.to_string());
								
								a_num.cmp(&b_num)
							}).unwrap();

							vector.iter().position(|r| r == elem).unwrap()
						},
						"items" => {
							for item in vector.iter() {
								computed_value.push_str(&format!(" {:?};", item).as_str());
							}
							return;
						},
						_ => { panic!("Unknown operation {}", x) }
					}
				} else {
					x.parse::<usize>()
						.ok()
						.ok_or(format!("Wrong index '{}' for vec '{:?}'", x, vector))
						.unwrap()
				};

				value = &vector
					.get(index)
					.ok_or(format!("Invalid index selector '{:?}' for vec '{:?}'", x, vector))
					.unwrap();
			},
			candid::parser::value::IDLValue::Variant(variant) => {
				let var = variant.0.as_ref();
				let field_id = candid::idl_hash(&x);

				let equal = match &var.id {
					Label::Id(id) => id.clone() == field_id,
					Label::Unnamed(id) => id.clone() == field_id,
					Label::Named(name) => x == name,
				};
				if !equal {
					panic!("Wrong selector {} for variant {:?}", x, var)
				}
				value = &var.val;
			},
			_ => {}
		}
	});

	if computed_value.is_empty() {
		format!("{:?}", value)
	} else {
		format!("{}", computed_value)
	}
}

fn parse_idl_number(x: String) -> usize {
	x.split(':')
	.next()
	.unwrap()
	.trim()
	.parse::<usize>()
	.ok()
	.ok_or(format!("Vec value is not a number"))
	.unwrap()
}