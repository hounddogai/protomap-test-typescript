import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPayoutAssignmentEngine } from "./payout-assignment-engine.js";
import { newPayoutAssignment } from "./payout-assignment.js";

test("PayoutAssignmentEngine keeps results within bounds", () => {
  const engine = defaultPayoutAssignmentEngine();
  const item = newPayoutAssignment("code-153", "label-618");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
