import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledBounceMilestoneEngine } from "./scheduled-bounce-milestone-engine.js";
import { newScheduledBounceMilestone } from "./scheduled-bounce-milestone.js";

test("ScheduledBounceMilestoneEngine keeps results within bounds", () => {
  const engine = defaultScheduledBounceMilestoneEngine(flags.newRegistry());
  const item = newScheduledBounceMilestone("code-467", "label-970");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
