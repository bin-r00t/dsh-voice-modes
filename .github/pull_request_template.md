## Summary

<!-- What changes, and why? -->

## Type

- [ ] Bug fix
- [ ] Feature
- [ ] New ASR provider adapter
- [ ] Documentation
- [ ] Tests / tooling
- [ ] Security

## Verification

<!-- Commands run and manual checks performed. -->

```bash
npm run check
npm test
```

## ASR provider checklist

Skip if not applicable.

- [ ] Adapter is inserted before the OpenAI-compatible fallback.
- [ ] `match(url)` is pure and does not perform network requests.
- [ ] Endpoint derivation handles a base URL and a full endpoint.
- [ ] Authentication headers are correct.
- [ ] Audio formats and size limits are enforced.
- [ ] `extractText` handles the documented response shape.
- [ ] Provider tests cover detection, request shape, limits and parsing.
- [ ] README and CHANGELOG are updated.
- [ ] Official provider documentation is linked.

## Security checklist

- [ ] No API keys, Authorization headers or private audio are logged.
- [ ] No secrets or personal data are included in tests or fixtures.
- [ ] The configured URL still goes through the Host proxy.
- [ ] No new dependency is added without justification.

## Notes for reviewers

<!-- Tradeoffs, follow-ups or open questions. -->
