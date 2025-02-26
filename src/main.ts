import * as core from "@actions/core";
import Cloudflare from "cloudflare";

export async function run(): Promise<void> {
  try {
    const additional_token = core.getInput("token");
    const account_id = core.getInput("account_id");

    const client = new Cloudflare({
      apiToken: additional_token,
    });

    core.info("==> Checking Generate only Token is Availables...");

    const response = await client.accounts.tokens.verify({
      account_id: account_id,
    });

    core.info(`Token Status: ${response.status}`);

    core.info("==> Creating Pages Deploy Only Secure Token...");
    let { result } = await client.accounts.tokens.permissionGroups.get({
      account_id: account_id,
    });
    /*     const secure_pages_token = await client.accounts.tokens.create({
      account_id: account_id,
      name: "Github Action Tempolay Token",
      policies: [
        {
          effect: "allow",
          permission_groups: [
            { name: permission_groups. }
            {}
          ],
          resources: {
            `com.cloudflare.api.account.zone.${account_id}`
          }
        }
      ]
    })
  */
    console.log(
      result.map((i) => {
        return i.name.includes("Pages");
      }),
    );
    //console.log(permission_groups)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
