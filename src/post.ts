import * as core from "@actions/core";
import Cloudflare from "cloudflare";

export async function run(): Promise<void> {
  try {
    const client = new Cloudflare({
      apiToken: core.getState("controller-token"),
    });

    core.info("==> Revoking Actions token...");

    const response = await client.accounts.tokens.delete(
      core.getState("cf-token-id"),
      {
        account_id: core.getInput("account_id"),
      },
    );

    core.info("==> Revoked Token.");
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
