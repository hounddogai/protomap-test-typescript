import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalSenderMilestoneEngine } from "./seasonal-sender-milestone-engine.js";
import { newSeasonalSenderMilestone } from "./seasonal-sender-milestone.js";

test("SeasonalSenderMilestoneEngine keeps results within bounds", () => {
  const engine = defaultSeasonalSenderMilestoneEngine();
  const item = newSeasonalSenderMilestone("code-481", "label-228");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
