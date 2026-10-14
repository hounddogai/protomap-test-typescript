import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCohortClaimEngine } from "./cohort-claim-engine.js";
import { newCohortClaim } from "./cohort-claim.js";

test("CohortClaimEngine keeps results within bounds", () => {
  const engine = defaultCohortClaimEngine();
  const item = newCohortClaim("code-995", "title-731");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
