import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWaitClaimEngine } from "./wait-claim-engine.js";
import { newWaitClaim } from "./wait-claim.js";

test("WaitClaimEngine keeps results within bounds", () => {
  const engine = defaultWaitClaimEngine();
  const item = newWaitClaim("code-453", "label-920");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
