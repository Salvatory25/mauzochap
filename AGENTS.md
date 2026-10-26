<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Deployment & Git Workflow
- Automatically stage, commit, and push verified changes to `origin main` upon completing tasks or requested updates so that live deployments on Vercel and Lovable sync immediately.
- Always verify changes (`npx tsc --noEmit`) before pushing to ensure clean builds.
- Never force push, rebase, or rewrite published git history.
