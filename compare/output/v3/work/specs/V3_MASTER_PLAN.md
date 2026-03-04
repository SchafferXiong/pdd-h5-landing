# V3 Master Plan

## Scope
- Build an isolated V3 landing page workspace under `compare/output/v3`.
- Apply image-driven visual enhancements while preserving a single download CTA path.

## Asset Integration
- Loading: closed/open envelope assets with timed transition.
- Hero/benefit/proof/convert: icon and avatar assets with explicit mappings.
- CTA: shine overlay asset with non-layout-shifting animation.
- Background: subtle repeating texture.

## Interaction Rules
- Loading flow total duration: 2000ms.
- Ticker text and avatar update in lockstep.
- Withdraw feed prepends newest row and keeps three rows.
- All images have fallback class behavior if load fails.

## Compatibility
- Keep existing IDs: `countdown`, `claimCount`, `rewardAmount`, `proofToast`.
- Keep existing CTA behavior and URL passthrough logic.

## QA Checklist
- Viewports: 360/390/430 and no overlap.
- Reduced motion mode fully downgraded.
- Broken image simulation still yields a functional page.
- CTA click path unchanged and consistent.
