import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDoubleOptInClaimEngine } from "./double-opt-in-claim-engine.js";
import { newDoubleOptInClaim } from "./double-opt-in-claim.js";

test("DoubleOptInClaimEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInClaimEngine();
  const item = newDoubleOptInClaim("code-848", "name-25");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
