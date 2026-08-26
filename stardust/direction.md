---
_provenance:
  writtenBy: stardust:replica
  writtenAt: 2026-08-26T16:05:00Z
  againstInput: https://www.centene.com/
  readArtifacts:
    - stardust/current/pages/index.json
    - stardust/replica/capture/tokens.json
    - stardust/replica/capture/lift-1440.json
    - stardust/replica/capture/lift-360.json
---

# Direction — preserve mode (same-design migration)

Mode: PRESERVE. The target spec is the captured current state of
https://www.centene.com/, synthesized on the bounded branch (no direct
invocation, no creative decisions).

Synthesized (bounded-single): current/pages/index.json + Phase-3 CSS lift →
PRODUCT.md · DESIGN.md · DESIGN.json (at 2026-08-26T16:05:00Z).

Permitted deltas: ONLY the entries of
stardust/replica/inconsistency-register.md (empty — pure replica).

Fidelity: ia verbatim · design verbatim · content verbatim.

Scope: home page (index) only — single-archetype pilot. A later site-scope
run re-runs Phase 1 with --prep, whose verbatim promotion REPLACES this
synthesized spec.
