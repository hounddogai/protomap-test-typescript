import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingLevelMilestoneEngine } from "./pending-level-milestone-engine.js";
import { newPendingLevelMilestone } from "./pending-level-milestone.js";

test("PendingLevelMilestoneEngine keeps results within bounds", () => {
  const engine = defaultPendingLevelMilestoneEngine(flags.newRegistry());
  const item = newPendingLevelMilestone("code-82", "label-7");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
