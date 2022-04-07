#!/usr/bin/env bash
set -e

identity=
root_wallet=
role_name="Agent"

while getopts ":-:" optchar; do
    case "${optchar}" in
        -)
            case "${OPTARG}" in
                ii)
										identity="${!OPTIND}"; OPTIND=$(( $OPTIND + 1 ))
                    ;;
                ii=*)
										identity=${OPTARG#*=}
                    ;;
                wallet)
										root_wallet="${!OPTIND}"; OPTIND=$(( $OPTIND + 1 ))
                    ;;
                wallet=*)
										root_wallet=${OPTARG#*=}
                    ;;
                name)
										role_name="${!OPTIND}"; OPTIND=$(( $OPTIND + 1 ))
                    ;;
                name=*)
										role_name=${OPTARG#*=}
                    ;;
                *)
                    if [ "$OPTERR" = 1 ] && [ "${optspec:0:1}" != ":" ]; then
                        echo "Unknown option --${OPTARG}" >&2
                    fi
                    ;;
            esac;;
    esac
done

args=
# TODO target using `./add-profile.sh --network ic`
# args=$@

[ -z "$identity" ] && echo "Princpal does not found" && exit;
[ -z "$root_wallet" ] && echo "Wallet does not found" && exit;

echo identity=$identity
echo root_wallet=$root_wallet

echo "Add internet-identity principal to root wallet"
create_role_program_args='(record {
	role_type = variant {
		Profile = record {
			principal_id = principal \"'$identity'\";
    	name = \"'$role_name'\";
    	description = \"'$role_name' profile created by add-profile.sh\";
			active = false;
		}
	}
})'
create_role_args="(record {
	title = \"Add internet-identity principal profile\";
	description = \"Internet-identity profile ${identity}\";
	rnp = record { role_id = 1 : nat32; permission_id = 0 : nat16; };
	authorization_delay_nano = 0 : nat64;
	program = variant {
		RemoteCallSequence = vec {
			record {
				endpoint = record {
					canister_id = principal \"${root_wallet}\";
					method_name = \"create_role\";
				};
				cycles = 0 : nat64;
				args = variant {
					CandidString = vec {
						\"${create_role_program_args}\"
					}	: vec text
				};
			}
		}
	}
})"
echo payload=$create_role_args
dfx canister $args call $root_wallet "execute" "$create_role_args"
