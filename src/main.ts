import * as core from "@actions/core";
import Cloudflare from "cloudflare";

export async function run(): Promise<void> {
  try {
    const additional_token = core.getInput("token");
    const account_id = core.getInput("account_id");

    const client = new Cloudflare({
      apiToken: additional_token,
    });

    core.info("==> Checking Token Availables...");

    const response = await client.accounts.tokens.verify({
      account_id: account_id,
    });

    core.info(`Token Status: ${response.status}`);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
