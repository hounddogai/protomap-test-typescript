import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReputationClaimEngine } from "./reputation-claim-engine.js";
import { newReputationClaim } from "./reputation-claim.js";

test("ReputationClaimEngine keeps results within bounds", () => {
  const engine = defaultReputationClaimEngine();
  const item = newReputationClaim("code-368", "label-986");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
