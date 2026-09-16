# Secure GitHub RSVP storage

The invitation is prepared to send RSVPs to a Cloudflare Worker. It validates each response and creates an issue in a separate private GitHub repository. Guests need no account.

## One-time setup

1. Create a **private** GitHub repository named `ye-and-nang-rsvp`.
2. Add the labels `rsvp`, `attending`, and `declined`.
3. Create a fine-grained GitHub token restricted to that repository with **Issues: Read and write** permission.
4. Deploy the `rsvp-worker` directory to Cloudflare Workers.
5. Add encrypted Worker secrets `GITHUB_TOKEN` and `GITHUB_REPOSITORY` (`librandshop/ye-and-nang-rsvp`).
6. Put the deployed Worker URL in `rsvp-config.js`, test once, and publish.

Never put the GitHub token in the invitation files, a Git commit, or a chat message. Enter it only in Cloudflare's encrypted secret field.

The invitation deliberately retains its previous submission endpoint until the Worker is deployed and verified, so unfinished setup cannot break the live RSVP.
