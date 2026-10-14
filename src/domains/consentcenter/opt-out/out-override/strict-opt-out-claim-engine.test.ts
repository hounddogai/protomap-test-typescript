import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictOptOutClaimEngine } from "./strict-opt-out-claim-engine.js";
import { newStrictOptOutClaim } from "./strict-opt-out-claim.js";

test("StrictOptOutClaimEngine keeps results within bounds", () => {
  const engine = defaultStrictOptOutClaimEngine();
  const item = newStrictOptOutClaim("code-685", "name-509");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
