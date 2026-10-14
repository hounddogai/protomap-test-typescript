import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionMilestoneEngine } from "./retention-milestone-engine.js";
import { newRetentionMilestone } from "./retention-milestone.js";

test("RetentionMilestoneEngine keeps results within bounds", () => {
  const engine = defaultRetentionMilestoneEngine(flags.newRegistry());
  const item = newRetentionMilestone("code-880", "label-532");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
