import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultMentionMilestoneEngine } from "./mention-milestone-engine.js";
import { newMentionMilestone } from "./mention-milestone.js";

test("MentionMilestoneEngine keeps results within bounds", () => {
  const engine = defaultMentionMilestoneEngine();
  const item = newMentionMilestone("code-380", "label-215");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
