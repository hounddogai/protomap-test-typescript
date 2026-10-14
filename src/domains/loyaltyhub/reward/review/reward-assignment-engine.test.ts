import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardAssignmentEngine } from "./reward-assignment-engine.js";
import { newRewardAssignment } from "./reward-assignment.js";

test("RewardAssignmentEngine keeps results within bounds", () => {
  const engine = defaultRewardAssignmentEngine(flags.newRegistry());
  const item = newRewardAssignment("code-296", "label-388");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
