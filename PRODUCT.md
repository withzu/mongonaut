# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: a small development team sharing one Mongonaut instance per environment.** A handful of engineers point one deployment at one MongoDB deployment (typically one instance per dev, staging and production database), sign in with built-in accounts or their company identity provider, and work on real data from the browser. Per database and per collection grants decide who may write, so the same instance serves people with different levels of trust.

The job is everyday database work during development and operations: find the collection, read documents, run a filter or aggregation, correct a record, and get back to the actual task. Sessions are short and frequent, not exploratory analysis.

Secondary audiences confirmed in the README but not the optimization target: a solo developer or home lab running one instance beside their own stack, and internal tools where colleagues only inspect data.

## Product Purpose

Mongonaut is a MongoDB management interface that runs as a web service next to the database it manages. It exists so that a team can browse databases and collections, inspect documents, query and aggregate, edit and create records, manage collections, and control who is allowed to do which of those, without anyone installing a desktop client and without handing the data to a hosted vendor.

Success is that Mongonaut becomes the tool the team actually opens for routine MongoDB work, rather than the fallback they use when the desktop client is not at hand.

## Positioning

Three claims, in the order the team defends them:

1. **Modern and web hosted, not a local application.** The interface lives with the deployment, not on individual machines. One URL, reachable from any browser, shared by the whole team, always the same version against the same database. No per person install, no per machine configuration, no local tunnels.
2. **Self-host in seconds.** One container, one connection URL, one secret. Published for Linux on AMD64 and ARM64 through GitHub Container Registry, and there is no vendor account anywhere in the path.
3. **Daily-driver UI quality.** Browsing, querying and editing are meant to be good enough to replace a desktop client for routine work. The craft of the interface itself is part of the offer, not decoration on top of a viewer.

Access control, read-only mode and identity provider support are real capabilities that make the shared instance safe, but they are not the headline claim.

## Operating Context

- Deployed as a Docker container, typically through Docker Compose on the same network as the MongoDB service. Default port `8081`, local development on `3000`.
- Remote access goes through a TLS terminating reverse proxy or an access gateway. The documented hardening path is Cloudflare Zero Trust Tunnel. The MongoDB port itself is never exposed publicly.
- Configuration is entirely environment variables. There is no settings file and no in-product installer beyond the first administrator setup screen.
- First visit in account mode runs an initial setup that creates the first administrator. Account records live in a hidden system database, `__mongonaut` by default.
- Administrator password recovery is a server side command run inside the container. It prints a temporary password to the container console, and signing in with it forces a new password.
- Typical usage is one browser tab kept open next to an editor and a terminal, on a desktop screen. The interface is also used from phones and tablets, where a dedicated mobile header and breadcrumb replace the sidebar chrome.
- Instances run against databases of very different shapes, from a handful of documents to collections large enough that pagination and server side filtering are the only workable path.

## Capabilities and Constraints

**Confirmed capabilities**

- Browse databases and collections, with server, database and collection information, sizes and document counts.
- Paginated document browsing, MongoDB filter and sort queries, and aggregation pipelines.
- Create, edit and delete documents through a JSON editor.
- Create, rename, duplicate and delete collections. Delete databases when write access allows it.
- Global read-only mode that disables every write path in the product.
- Four authentication modes: built-in accounts, one shared static password, OpenID Connect, and none.
- Per account grants at database and collection level with `read` or `readWrite` access, plus wildcard collection grants, an admin flag and an account disabled flag.
- Administrator account management inside the product, OIDC email allowlist, configurable session lifetime, per IP and instance-wide login attempt limits with lockout.
- Light and dark theme, both shipped.

**Technical constraints**

- Next.js App Router, React, TypeScript, Tailwind CSS v4 with an HSL CSS variable token layer, the official MongoDB Node.js driver. Distributed as a single Docker image, MIT licensed.
- Node.js 24 and pnpm for local development. pnpm is the package manager, never npm or yarn.
- Requires a reachable MongoDB deployment. Nothing works offline or with mocked data.
- Every capability has to degrade correctly under two independent restrictions: the global read-only flag, and the signed-in account's grants. Any surface that offers a write action must be able to render the same surface without it.
- Server errors surface as MongoDB connection and permission failures, so connection failure is a first-class product state, not an edge case.

**Explicitly undecided**

- The component base (shadcn-style components on Radix primitives) is the incumbent implementation but was not declared a binding commitment. It may be revisited.
- The current warm paper neutral theme is the incumbent visual world, not a fixed brand asset. Only the amber identity below is binding.

## Brand Commitments

- Name: **Mongonaut**, a product of **The Zu Company**.
- **Amber `#FFB211` is brand identity, not a theme choice.** It stays the accent identity of the product wherever the product is styled.
- The Zu Company logos, the MIT license, and links to `mongonaut.org` and the GitHub repository stay present in the product.
- Voice is plain, technical and unhyped. The README states facts and configuration, never benefits or superlatives. User-facing text avoids dashes, both hyphen-style and em dashes, in favour of plain wording.
- Documentation lives at `mongonaut.org/docs`, outside this repository. The product links to it rather than restating it.

## Evidence on Hand

- Logo and brand assets: `public/images/logo.svg`, `public/images/logo.png`, `public/images/zu/logo.svg`, `public/images/zu/logo-dark.svg`, `public/images/github-mark.svg`, `src/app/icon.png`.
- Repository banner: `.github/banner.png`. A full interface screenshot is embedded in `README.md`.
- Typography currently in use: Geist Sans and Geist Mono via `next/font`.
- Incumbent visual world: `src/app/globals.css`, a warm paper neutral palette with an amber accent in both light and dark.
- Real product surfaces that can be shown: sidebar database tree, collection document view, query panel, JSON document editor, account manager, login, first-run setup, about page, connection error state.
- Public proof: MIT license, GitHub releases, stars and issues, the published container image.
- **Absent and not to be invented:** no testimonials, no named customers, no user counts, no download or performance benchmarks, no pricing, no commercial plan, no SLA, no security certification. The product is beta software and says so.

## Product Principles

1. **The instance is shared, so the interface must show what this person may do.** Read-only mode and grants are not error states to hit at submit time. Whatever a given account cannot do should be visibly absent or clearly disabled before it is attempted.
2. **Optimize for the return visit, not the first visit.** The primary user opens Mongonaut many times a day for a short task. Speed to the right collection and low ceremony beat introduction and explanation.
3. **Never pretend about the data.** Sizes, counts, versions and connection state come from the server and are shown as they are. No estimates presented as facts, no optimistic success before the write is confirmed.
4. **Earn the trust that direct database access requires.** This tool can modify production data. Destructive actions must be unmistakable, reversible where possible, and never one accidental click away.
5. **Stay one container.** Nothing in the product may assume extra infrastructure, an outbound network call, telemetry, or a hosted service to function.
