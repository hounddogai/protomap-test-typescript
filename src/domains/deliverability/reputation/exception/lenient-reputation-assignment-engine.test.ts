import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientReputationAssignmentEngine } from "./lenient-reputation-assignment-engine.js";
import { newLenientReputationAssignment } from "./lenient-reputation-assignment.js";

test("LenientReputationAssignmentEngine keeps results within bounds", () => {
  const engine = defaultLenientReputationAssignmentEngine(flags.newRegistry());
  const item = newLenientReputationAssignment("code-544", "name-73");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
