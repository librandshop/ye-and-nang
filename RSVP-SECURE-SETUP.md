# Secure GitHub RSVP storage

The invitation is prepared to send RSVPs to a Cloudflare Worker. It validates each response and creates an issue in a separate private GitHub repository. Guests need no account.

## One-time setup

1. Create a **private** GitHub repository named `ye-and-nang-rsvp`.
2. Add the labels `rsvp`, `attending`, and `declined`.
3. Create a fine-grained GitHub token restricted to that repository with **Issues: Read and write** permission.
4. Deploy the `rsvp-worker` directory to Cloudflare Workers. Its `wrangler.jsonc` declares both required secrets and enables production logs.
5. Add the encrypted Worker secret `GITHUB_TOKEN`. The private repository name is already configured as `librandshop/ye-and-nang-rsvp`.
6. The deployed Worker URL is configured in `rsvp-config.js`. Test once, then publish.

Never put the GitHub token in the invitation files, a Git commit, or a chat message. Enter it only in Cloudflare's encrypted secret field.

The invitation now submits only to the verified Worker. Google Forms is no longer part of the RSVP flow.
