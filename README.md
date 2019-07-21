# @ethvault/ens-manager-contract

[![Build Status](https://travis-ci.org/ethvault/ens-registrar-contract.svg?branch=master)](https://travis-ci.org/ethvault/ens-registrar-contract)

The registry contract that owns the ENS domain `ethvault.xyz`.

This is used to limit the user's risk of using an uncontrolled ENS domain to point to their own address, and 
simplify the process of claiming an ENS subdomain.

- Prevent an attacker from changing the address associated with a user domain
- Register subdomains *.ethvault.xyz and set the resolver in a single transaction
