import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultJourneyMilestoneEngine } from "./journey-milestone-engine.js";
import { newJourneyMilestone } from "./journey-milestone.js";

test("JourneyMilestoneEngine keeps results within bounds", () => {
  const engine = defaultJourneyMilestoneEngine(flags.newRegistry());
  const item = newJourneyMilestone("code-385", "title-162");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
