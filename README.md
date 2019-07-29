# @ethvault/ens-registrar-contract

[![Build Status](https://travis-ci.org/ethvault/ens-registrar-contract.svg?branch=master)](https://travis-ci.org/ethvault/ens-registrar-contract)

The registry contract that owns the ENS domain `myethvault.com`.

This is used to limit the user's risk of using an uncontrolled ENS domain to point to their own address, and 
simplify the process of claiming an ENS subdomain for `myethvault.com`.

- Prevent an attacker from changing the address associated with a user domain
- Register subdomains *.myethvault.com and set the resolver to the address in a single transaction
- Support sending some value to each address upon registration

We cannot set the reverse record for the user because that would involve signing a transaction with their private keys.
