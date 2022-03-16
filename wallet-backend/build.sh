#!/bin/bash

SCRIPT=$(readlink -f "$0")
SCRIPTPATH=$(dirname "$SCRIPT")
cd "$SCRIPTPATH" || exit

cargo build --target wasm32-unknown-unknown --package union-wallet --release && \
     ic-cdk-optimizer ./target/wasm32-unknown-unknown/release/union_wallet.wasm -o ./target/wasm32-unknown-unknown/release/union-wallet-opt.wasm