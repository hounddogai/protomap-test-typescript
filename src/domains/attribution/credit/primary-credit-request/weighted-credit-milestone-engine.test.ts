import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedCreditMilestoneEngine } from "./weighted-credit-milestone-engine.js";
import { newWeightedCreditMilestone } from "./weighted-credit-milestone.js";

test("WeightedCreditMilestoneEngine keeps results within bounds", () => {
  const engine = defaultWeightedCreditMilestoneEngine();
  const item = newWeightedCreditMilestone("code-548", "label-966");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
