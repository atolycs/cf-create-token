# Input

> [!IMPORTANT]
> This Action is unofficial action. Please careful.


```
on:
  workflow_dispatch:

...
  - name: Create Cloudflare Temporaly Token
    id: cf-create-token
    uses: atolycs/cf-create-token@main
    with:
     token: ${{ secrets.CF_TOKEN }}
     account_id: ${{ secrets.CF_ACCOUNT_ID }}

...
   - name: Deploy Pages
     uses: cloudflare/wrangler-action@v3
     with:
       apiToken: ${{ outputs.steps.cf-create-token.token }}
...

```

# Input
`token`: Cloudflare Additional Permission Only Token

`account_id`: Cloudflare Account ID

`github_token`: Github Token (optional)


# Output
`cf-token`: Generated Temporaly Pages Deploy Token

