import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptivePayoutAssignmentEngine } from "./adaptive-payout-assignment-engine.js";
import { newAdaptivePayoutAssignment } from "./adaptive-payout-assignment.js";

test("AdaptivePayoutAssignmentEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePayoutAssignmentEngine();
  const item = newAdaptivePayoutAssignment("code-554", "title-207");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
