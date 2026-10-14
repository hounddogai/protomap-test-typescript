import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEscalationMilestoneEngine } from "./escalation-milestone-engine.js";
import { newEscalationMilestone } from "./escalation-milestone.js";

test("EscalationMilestoneEngine keeps results within bounds", () => {
  const engine = defaultEscalationMilestoneEngine();
  const item = newEscalationMilestone("code-7", "name-286");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
