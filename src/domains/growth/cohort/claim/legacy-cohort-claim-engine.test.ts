import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyCohortClaimEngine } from "./legacy-cohort-claim-engine.js";
import { newLegacyCohortClaim } from "./legacy-cohort-claim.js";

test("LegacyCohortClaimEngine keeps results within bounds", () => {
  const engine = defaultLegacyCohortClaimEngine();
  const item = newLegacyCohortClaim("code-193", "title-630");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
