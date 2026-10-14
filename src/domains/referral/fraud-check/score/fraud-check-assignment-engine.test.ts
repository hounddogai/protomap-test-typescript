import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFraudCheckAssignmentEngine } from "./fraud-check-assignment-engine.js";
import { newFraudCheckAssignment } from "./fraud-check-assignment.js";

test("FraudCheckAssignmentEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckAssignmentEngine(flags.newRegistry());
  const item = newFraudCheckAssignment("code-648", "title-850");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
