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
    const additional_token = core.getInput("token");
    const groupList = ["Pages Write", "Pages Read"];

    core.info("==> Getting Github action metadata...");
    const gitHubActionsRange = getGitHubIP();

    const client = new Cloudflare({
      apiToken: additional_token,
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

    //console.dir(perm_response.result, {'maxArrayLength': null})
    /*     const groups = perm_response.result.find((g: any) => {
    	return g.name === "Pages Write"
    })
 */

    /*     const groups = await Promise.all(
      groupList.map(async (c) => {
        const temp_permission = await perm_response.result.find((g: any) => {
          return g.name === c;
        });
        return temp_permission;
      }),
    ); */

    const payload: TokenCreateParams = {
      account_id,
      name: "Github Actions Temporaly Token",
      policies: await Promise.all(
        groupList.map(async (permission) => {
          const temp_permission = await perm_response.result.find((g: any) => {
            return g.name === permission;
          });

          let resource = `${temp_permission.scopes}.zone.${account_id}`;

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

    console.log(token_response);
    //console.log(permission_groups)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
