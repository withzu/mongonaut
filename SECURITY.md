# Security Policy

Mongonaut has direct read and write access to the MongoDB deployment it is connected to. Please treat a finding in Mongonaut the same way you would treat a finding in any other administrative interface.

## Supported Versions

Mongonaut is beta software. Only the most recent release receives security fixes.

| Version | Supported |
| --- | --- |
| Latest release | Yes |
| Any earlier release | No |

Release history is available on the [releases page](https://github.com/withzu/mongonaut/releases).

## Reporting a Vulnerability

Please report security issues privately through GitHub, using
[Report a vulnerability](https://github.com/withzu/mongonaut/security/advisories/new) on this
repository. The report stays private until a fix is released.

Do not open a public issue for a security problem, and do not post a proof of concept publicly before a fix is available.

A useful report contains:

* The Mongonaut version, taken from the about page or the image tag.
* `MONGONAUT_AUTH_MODE` and whether `MONGONAUT_READONLY` was enabled.
* Whether Mongonaut was running behind a reverse proxy or an access gateway.
* The steps needed to reproduce the behaviour.
* What an attacker gains, for example reading data they have no grant for, writing in read only mode, or bypassing the login.

We confirm receipt within a few working days and keep you informed while the issue is investigated. Once a fix is released, the advisory credits the reporter unless you prefer otherwise.

## Scope

In scope:

* Bypassing authentication in `ACCOUNT`, `STATIC_PASSWORD` or `OIDC` mode.
* Reading or writing a database or collection the signed in account holds no grant for.
* Any write that succeeds while `MONGONAUT_READONLY=true`.
* Reaching the Mongonaut system database, `__mongonaut` by default, or a MongoDB system database through the interface.
* Executing server side JavaScript while `MONGONAUT_ALLOW_SERVER_JS=false`.
* Session handling, the login attempt limits, and the administrator recovery command.
* Leaking secrets into responses, logs or the audit log.

Out of scope, because these are configuration choices rather than defects:

* An instance deliberately run with `MONGONAUT_AUTH_MODE=NONE`.
* An instance exposed to the public internet without TLS or network controls, against the guidance in the README.
* Actions a signed in account is allowed to perform through its grants, including deleting data.
* The permissions of the MongoDB user in `MONGO_CONNECTION_URL`. Mongonaut can never do less than that user allows, which is why a dedicated MongoDB account with only the required permissions is recommended.
* Reports produced solely by an automated scanner, without a demonstrated impact on Mongonaut.

## Hardening

The README documents the recommended deployment, including TLS through a reverse proxy, read only mode, a dedicated MongoDB account, the audit log, and `MONGONAUT_TRUSTED_PROXY_HOPS` so that per client login limits work behind a proxy.
