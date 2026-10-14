import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictPayoutAssignmentEngine } from "./strict-payout-assignment-engine.js";
import { newStrictPayoutAssignment } from "./strict-payout-assignment.js";

test("StrictPayoutAssignmentEngine keeps results within bounds", () => {
  const engine = defaultStrictPayoutAssignmentEngine(flags.newRegistry());
  const item = newStrictPayoutAssignment("code-531", "label-686");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
