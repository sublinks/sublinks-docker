#!/bin/bash

# Taken from: https://stackoverflow.com/a/53175209/564576
function encode_password()
{
    SALT=$(od -A n -t x -N 4 /dev/urandom)
    PASS=$SALT$(echo -n $1 | xxd -ps | tr -d '\n' | tr -d ' ')
    PASS=$(echo -n $PASS | xxd -r -p | sha256sum | head -c 128)
    PASS=$(echo -n $SALT$PASS | xxd -r -p | base64 | tr -d '\n')
    echo $PASS
}

echo -ne "Password hash for sublinks: "
encode_password "sublinks"
echo -ne "Password hash for federation: "
encode_password "federation"
echo -ne "Password hash for admin: "
encode_password "admin"

