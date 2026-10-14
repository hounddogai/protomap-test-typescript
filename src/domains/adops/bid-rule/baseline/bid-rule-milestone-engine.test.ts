import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBidRuleMilestoneEngine } from "./bid-rule-milestone-engine.js";
import { newBidRuleMilestone } from "./bid-rule-milestone.js";

test("BidRuleMilestoneEngine keeps results within bounds", () => {
  const engine = defaultBidRuleMilestoneEngine();
  const item = newBidRuleMilestone("code-921", "label-863");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
