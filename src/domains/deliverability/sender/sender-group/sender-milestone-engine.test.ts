import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSenderMilestoneEngine } from "./sender-milestone-engine.js";
import { newSenderMilestone } from "./sender-milestone.js";

test("SenderMilestoneEngine keeps results within bounds", () => {
  const engine = defaultSenderMilestoneEngine();
  const item = newSenderMilestone("code-142", "label-459");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
