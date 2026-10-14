import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRedemptionMilestoneEngine } from "./redemption-milestone-engine.js";
import { newRedemptionMilestone } from "./redemption-milestone.js";

test("RedemptionMilestoneEngine keeps results within bounds", () => {
  const engine = defaultRedemptionMilestoneEngine(flags.newRegistry());
  const item = newRedemptionMilestone("code-466", "name-767");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
