#!/usr/bin/env bash
set -e
. ./scripts/log.sh
source .env

args=
log "Sending batches..."

echo ${frontend_canister_id_did//\"/\\\"}

operations=""
for i in ${!batch_ids[@]}
do
	element="${batch_ids[i]}"
	send_batch_args='(record { batch_id = '$element'; target_canister = '${frontend_canister_id_did//\"/\\\"}' })'
	operations+="
		record {
			endpoint = record {
				canister_id = principal \"${root_wallet}\";
				method_name = \"send_batch\";
			};
			cycles = 0 : nat64;
			args = variant {
				CandidString = vec {
					\"${send_batch_args}\"
				}	: vec text
			}
		};
	"
done

send_batches_args="(record {
	title = \"Send batches to frontend canister\";
	description = \"Send first assets to frontend canister\";
	rnp = record { role_id = 1 : nat32; permission_id = 0 : nat16; };
	authorization_delay_nano = 0 : nat64;
	program = variant {
		RemoteCallSequence = vec {
			${operations}
		}
	}
})"

dfx canister $args call $root_wallet "execute" "${send_batches_args}"

log "Frontend canister ready"