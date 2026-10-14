import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualRedemptionAssignmentEngine } from "./manual-redemption-assignment-engine.js";
import { newManualRedemptionAssignment } from "./manual-redemption-assignment.js";

test("ManualRedemptionAssignmentEngine keeps results within bounds", () => {
  const engine = defaultManualRedemptionAssignmentEngine(flags.newRegistry());
  const item = newManualRedemptionAssignment("code-119", "label-501");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
