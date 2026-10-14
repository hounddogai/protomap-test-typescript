import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedQueueMilestoneEngine } from "./batched-queue-milestone-engine.js";
import { newBatchedQueueMilestone } from "./batched-queue-milestone.js";

test("BatchedQueueMilestoneEngine keeps results within bounds", () => {
  const engine = defaultBatchedQueueMilestoneEngine(flags.newRegistry());
  const item = newBatchedQueueMilestone("code-810", "label-102");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
