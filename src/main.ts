import * as core from "@actions/core";
import * as github from "@actions/github";
import Cloudflare from "cloudflare";
import { TokenCreateParams } from "cloudflare/resources/accounts/index.mjs";
import {
  PermissionGroupGetResponse,
  PermissionGroupGetResponsesSinglePage,
} from "cloudflare/resources/accounts/tokens/permission-groups.mjs";
import { resourceLimits } from "worker_threads";

//async function getPermissionGroupId(permissionName: string): Promise<string> {
//	try {
//	  const response =
//	}
//}

async function getGitHubIP(
  batch: string = "actions",
  retries: number = 3,
): Promise<string[] | undefined> {
  try {
    const githubToken = core.getInput("github_token");
    const octokit = github.getOctokit(githubToken);

    const response = (await octokit.rest.meta.get()).data.actions;
    return response || [];
  } catch (e) {
    console.log(e);
  }
}

/* async function fetchCloudflarePermissionGroup(): Promise<PermissionGroupGetResponsesSinglePage> {

} */

export async function run(): Promise<void> {
  try {
    const control_token = core.getInput("token");
    const groupList = ["Pages Write", "Pages Read"];

    core.info("==> Getting Github action metadata...");

    const client = new Cloudflare({
      apiToken: control_token,
    });

    core.info("==> Checking Generate only Token is Availables...");

    const account_id = core.getInput("account_id");

    const response = await client.accounts.tokens.verify({
      account_id: account_id,
    });

    core.info(`Token Status: ${response.status}`);

    core.info("==> Creating Pages Deploy Only Secure Token...");

    const perm_response = await client.accounts.tokens.permissionGroups.list({
      account_id: account_id,
    });

    const payload: TokenCreateParams = {
      account_id,
      name: "Github Actions Temporaly Token",
      policies: await Promise.all(
        groupList.map(async (permission) => {
          const temp_permission = await perm_response.result.find((g: any) => {
            return g.name === permission;
          });
          let resource = `${temp_permission.scopes}.${account_id}`;
          return {
            effect: "allow",
            permission_groups: [
              {
                id: temp_permission.id,
              },
            ],
            resources: {
              [resource]: "*",
            },
          };
        }),
      ),
      condition: {
        request_ip: {
          in: await getGitHubIP(),
        },
      },
      not_before: new Date().toISOString().split(".")[0] + "Z",
    };

    console.log(payload);
    const token_response = await client.accounts.tokens.create(payload);

    core.info("==> Temporaly Token Generated.");

    core.setSecret(token_response.value);
    core.setOutput("cf-token", token_response.value);
    core.saveState("cf-token-id", token_response.id);
    core.saveState("cf-token", token_response.value);
    core.saveState("controller-token", control_token);
    //console.log(permission_groups)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
