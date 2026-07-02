<p align="center">
  <img src=".github/banner.png" width="100%" alt="Mongonaut" />
</p>

<p align="center">
  <strong>A modern, open source MongoDB web interface built for self hosted environments.</strong>
</p>

<p align="center">
  Browse databases, query collections, edit documents, and manage access directly from your browser.
</p>

<p align="center">
  <a href="https://mongonaut.org">Website</a>
  ·
  <a href="https://mongonaut.org/docs">Documentation</a>
  ·
  <a href="https://mongonaut.org/docs/installation">Installation</a>
  ·
  <a href="https://github.com/withzu/mongonaut/releases">Releases</a>
  ·
  <a href="https://github.com/withzu/mongonaut/issues">Issues</a>
</p>

<p align="center">
  <a href="https://github.com/withzu/mongonaut/releases">
    <img alt="Latest release" src="https://img.shields.io/github/v/release/withzu/mongonaut?display_name=tag" />
  </a>
  <a href="https://github.com/withzu/mongonaut/stargazers">
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/withzu/mongonaut" />
  </a>
  <a href="LICENSE">
    <img alt="MIT License" src="https://img.shields.io/github/license/withzu/mongonaut" />
  </a>
</p>

<p align="center">
  <img width="2560" height="1436" alt="Mongonaut interface" src="https://github.com/user-attachments/assets/b18b325b-881f-44d8-99b9-ec3ddc997c2d" />
</p>

## About Mongonaut

Mongonaut is a lightweight MongoDB management interface that runs as a web service alongside your database. It is designed for developers, small teams, internal tools, home labs, and other environments where a browser based MongoDB interface is more practical than a locally installed desktop client.

Mongonaut is built with Next.js, React, TypeScript, and the official MongoDB Node.js driver. It is distributed as a Docker image and licensed under the MIT License.

## Features

* Browse MongoDB databases and collections
* View server, database, and collection information
* Browse large collections with pagination
* Filter and sort documents with MongoDB queries
* Run aggregation pipelines
* Create, edit, and delete documents
* Create, rename, duplicate, and delete collections
* Delete databases when write access is enabled
* Use a global read only mode for safer access
* Protect the interface with built in accounts
* Use a shared static password for simple internal deployments
* Connect an OpenID Connect identity provider
* Restrict OIDC access with an email allowlist
* Configure session lifetime and login protection
* Recover administrator access with a temporary password
* Deploy through GitHub Container Registry on AMD64 and ARM64

## Quick Start

Mongonaut uses the built in account system by default. The following example starts a temporary MongoDB container and Mongonaut on the same Docker network.

```bash
docker network create mongonaut-network

docker run -d \
  --name mongonaut-mongo \
  --network mongonaut-network \
  mongo:latest

export MONGONAUT_AUTH_SECRET="$(openssl rand -hex 32)"

docker run --rm \
  --name mongonaut \
  --network mongonaut-network \
  -p 8081:8081 \
  -e MONGO_CONNECTION_URL="mongodb://mongonaut-mongo:27017/" \
  -e MONGONAUT_AUTH_MODE="ACCOUNT" \
  -e MONGONAUT_AUTH_SECRET="$MONGONAUT_AUTH_SECRET" \
  ghcr.io/withzu/mongonaut:latest
```

Open `http://localhost:8081` and follow the initial setup to create the first administrator.

Replace `MONGO_CONNECTION_URL` with your own MongoDB URI when connecting to an existing deployment. The hostname must be reachable from inside the Mongonaut container.

> [!WARNING]
> Never expose Mongonaut to the public internet without authentication, TLS, and appropriate network controls. Mongonaut can read and modify the connected database unless read only mode is enabled.

## Docker Compose

Create a `.env` file next to your Compose file:

```dotenv
MONGONAUT_AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters
```

You can generate a suitable value with:

```bash
openssl rand -hex 32
```

Create `compose.yml`:

```yaml
services:
  mongo:
    image: mongo:latest
    restart: unless-stopped
    volumes:
      - mongo-data:/data/db
    networks:
      - mongo-network

  mongonaut:
    image: ghcr.io/withzu/mongonaut:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:8081:8081"
    environment:
      MONGO_CONNECTION_URL: mongodb://mongo:27017/
      MONGONAUT_AUTH_MODE: ACCOUNT
      MONGONAUT_AUTH_SECRET: ${MONGONAUT_AUTH_SECRET}
      MONGONAUT_READONLY: "false"
    depends_on:
      - mongo
    networks:
      - mongo-network

volumes:
  mongo-data:

networks:
  mongo-network:
    driver: bridge
```

Start the services:

```bash
docker compose up -d
```

The example binds Mongonaut to localhost. Put a TLS enabled reverse proxy in front of it when remote access is required.

## Container Images

Mongonaut release images are published through GitHub Container Registry for Linux on AMD64 and ARM64.

```text
ghcr.io/withzu/mongonaut:latest
```

For production installations, consider pinning a specific release instead of using `latest`.

```yaml
image: ghcr.io/withzu/mongonaut:0.1.6
```

Available versions are listed on the [GitHub Releases page](https://github.com/withzu/mongonaut/releases).

## Authentication

Mongonaut supports four authentication modes through `MONGONAUT_AUTH_MODE`.

| Mode | Description | Recommended use |
| --- | --- | --- |
| `ACCOUNT` | Built in user and administrator accounts stored in a dedicated MongoDB database | Most self hosted and team installations |
| `STATIC_PASSWORD` | One shared password for the entire instance | Small internal installations |
| `OIDC` | Authentication through an OpenID Connect provider | Organizations with an existing identity provider |
| `NONE` | No application level authentication | Local development or an independently protected network only |

Authentication modes other than `NONE` require `MONGONAUT_AUTH_SECRET`.

### Built In Accounts

Built in accounts are enabled by default.

```dotenv
MONGONAUT_AUTH_MODE=ACCOUNT
MONGONAUT_AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters
```

On the first visit, Mongonaut asks you to create the initial administrator. Further accounts can then be managed inside Mongonaut.

Account records are stored in the hidden `__mongonaut` database by default. The database name can be changed with `MONGONAUT_SYSTEM_DB`.

### Static Password

```dotenv
MONGONAUT_AUTH_MODE=STATIC_PASSWORD
MONGONAUT_AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters
MONGONAUT_AUTH_PASSWORD=replace-with-a-strong-password
```

Static password and account logins include configurable login attempt limits and lockout protection.

### OpenID Connect

```dotenv
MONGONAUT_AUTH_MODE=OIDC
MONGONAUT_AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters
MONGONAUT_OIDC_ISSUER=https://identity.example.com
MONGONAUT_OIDC_CLIENT_ID=mongonaut
MONGONAUT_OIDC_CLIENT_SECRET=replace-with-the-client-secret
MONGONAUT_OIDC_SCOPES=openid profile email
```

Mongonaut automatically derives the callback URL from the incoming request:

```text
https://your-mongonaut-domain.example/api/auth/oidc/callback
```

You can set an explicit callback URL when automatic detection does not match your deployment:

```dotenv
MONGONAUT_OIDC_REDIRECT_URL=https://your-mongonaut-domain.example/api/auth/oidc/callback
```

Access can optionally be restricted to specific email addresses:

```dotenv
MONGONAUT_OIDC_ALLOWED_EMAILS=alice@example.com,bob@example.com
```

Leave the allowlist empty to permit every identity successfully authenticated by the configured provider.

### Disabling Authentication

```dotenv
MONGONAUT_AUTH_MODE=NONE
```

Only use this mode for local development or when access is fully protected by another trusted layer.

## Read Only Mode

Read only mode disables data modifications through Mongonaut.

```dotenv
MONGONAUT_READONLY=true
```

Use read only mode for observability, support access, demonstrations, and environments where users only need to inspect data.

For stronger protection, use a dedicated MongoDB account with only the required database permissions. Account mode also needs permission to store account data in the configured Mongonaut system database.

## Environment Variables

### MongoDB and Runtime

| Variable | Description | Default |
| --- | --- | --- |
| `MONGO_CONNECTION_URL` | MongoDB connection string used by Mongonaut | `mongodb://localhost:27017` |
| `MONGONAUT_READONLY` | Disables write operations when set to `true` | `false` |
| `MONGONAUT_TIMEOUT` | MongoDB connection and server selection timeout in milliseconds | `5000` |

Set `MONGO_CONNECTION_URL` explicitly when running Mongonaut in a container. The fallback address points to the Mongonaut container itself.

### Authentication

| Variable | Description | Default |
| --- | --- | --- |
| `MONGONAUT_AUTH_MODE` | Authentication mode: `NONE`, `STATIC_PASSWORD`, `OIDC`, or `ACCOUNT` | `ACCOUNT` |
| `MONGONAUT_AUTH_SECRET` | Secret used to protect authentication sessions. Required for every mode except `NONE` | None |
| `MONGONAUT_SESSION_TTL` | Session lifetime in seconds | `86400` |
| `MONGONAUT_AUTH_PASSWORD` | Shared password used by `STATIC_PASSWORD` mode | None |

### Login Protection

These settings apply to static password and account logins.

| Variable | Description | Default |
| --- | --- | --- |
| `MONGONAUT_LOGIN_MAX_ATTEMPTS` | Maximum login attempts per IP within the configured window | `5` |
| `MONGONAUT_LOGIN_WINDOW_SECONDS` | Per IP attempt window in seconds | `900` |
| `MONGONAUT_LOGIN_LOCKOUT_SECONDS` | Lockout duration in seconds | `900` |
| `MONGONAUT_LOGIN_GLOBAL_MAX_ATTEMPTS` | Maximum login attempts across the complete instance within the global window | `50` |
| `MONGONAUT_LOGIN_GLOBAL_WINDOW_SECONDS` | Global attempt window in seconds | `300` |

### OpenID Connect

| Variable | Description | Default |
| --- | --- | --- |
| `MONGONAUT_OIDC_ISSUER` | OIDC issuer URL | None |
| `MONGONAUT_OIDC_CLIENT_ID` | OIDC client identifier | None |
| `MONGONAUT_OIDC_CLIENT_SECRET` | OIDC client secret | None |
| `MONGONAUT_OIDC_SCOPES` | Space separated OIDC scopes | `openid profile email` |
| `MONGONAUT_OIDC_REDIRECT_URL` | Explicit OIDC callback URL | Derived from the incoming request |
| `MONGONAUT_OIDC_ALLOWED_EMAILS` | Optional comma separated email allowlist | All authenticated identities |

### Account Mode

| Variable | Description | Default |
| --- | --- | --- |
| `MONGONAUT_SYSTEM_DB` | Internal database used to store Mongonaut accounts | `__mongonaut` |
| `MONGONAUT_RECOVERY_TTL_MINUTES` | Lifetime of temporary recovery passwords in minutes | `30` |

## Administrator Password Recovery

Account mode includes a server side recovery command. It creates a temporary password without replacing the existing password immediately. Signing in with the temporary password requires the user to choose a new password.

Recover a specific account from a running container:

```bash
docker exec -it mongonaut node scripts/recovery.mjs admin@example.com
```

Recover all administrator accounts:

```bash
docker exec -it mongonaut node scripts/recovery.mjs
```

The temporary password is printed in the container console and remains valid for the configured recovery period.

## Security Recommendations

Mongonaut provides direct access to MongoDB data. Treat it like any other administrative interface.

1. Keep application authentication enabled.
2. Use HTTPS through a trusted reverse proxy or secure access gateway.
3. Do not expose the MongoDB port publicly.
4. Restrict Mongonaut and MongoDB with container or host network rules.
5. Use a dedicated MongoDB account with only the permissions the deployment requires.
6. Enable read only mode when users do not need to modify data.
7. Store secrets outside the repository and rotate them when exposure is suspected.
8. Keep Mongonaut and MongoDB updated.

The documentation includes a guide for securing Mongonaut with [Cloudflare Zero Trust Tunnel](https://mongonaut.org/docs/security/zero-trust-tunnel).

## Local Development

### Requirements

* Node.js 24
* pnpm 11
* A reachable MongoDB instance

### Setup

Clone the repository:

```bash
git clone https://github.com/withzu/mongonaut.git
cd mongonaut
```

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

At minimum, configure the MongoDB connection and authentication secret:

```dotenv
MONGO_CONNECTION_URL=mongodb://localhost:27017/
MONGONAUT_AUTH_MODE=ACCOUNT
MONGONAUT_AUTH_SECRET=replace-with-a-random-secret-of-at-least-32-characters
```

Start the development server:

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Useful Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format supported source files with Prettier |
| `pnpm test:format` | Check source formatting |
| `pnpm recovery [email]` | Create a temporary password for an account or all administrators |

## Build the Docker Image Locally

```bash
docker build -t mongonaut:local .
```

Run the local image:

```bash
docker run --rm \
  --name mongonaut \
  -p 8081:8081 \
  -e MONGO_CONNECTION_URL="mongodb://host.docker.internal:27017/" \
  -e MONGONAUT_AUTH_MODE="ACCOUNT" \
  -e MONGONAUT_AUTH_SECRET="$(openssl rand -hex 32)" \
  mongonaut:local
```

Depending on the operating system and Docker configuration, the host address may need to be replaced with another address reachable from the container.

## Contributing

Contributions, bug reports, and feature ideas are welcome.

1. Search the existing [issues](https://github.com/withzu/mongonaut/issues) before opening a new one.
2. Open an issue before starting a large or behavior changing contribution.
3. Fork the repository and create a focused branch.
4. Keep changes small and document relevant behavior.
5. Run linting and formatting checks before opening a pull request.

```bash
pnpm lint
pnpm test:format
pnpm build
```

## Project Status

Mongonaut is actively developed and currently released as beta software. Interfaces, configuration, and behavior may still change between releases.

See the [release history](https://github.com/withzu/mongonaut/releases) for current versions and changes.

## License

Mongonaut is licensed under the [MIT License](LICENSE).

Mongonaut is developed by [The Zu Company](https://thezucompany.com).
