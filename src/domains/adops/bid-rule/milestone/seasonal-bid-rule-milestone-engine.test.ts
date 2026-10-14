import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalBidRuleMilestoneEngine } from "./seasonal-bid-rule-milestone-engine.js";
import { newSeasonalBidRuleMilestone } from "./seasonal-bid-rule-milestone.js";

test("SeasonalBidRuleMilestoneEngine keeps results within bounds", () => {
  const engine = defaultSeasonalBidRuleMilestoneEngine();
  const item = newSeasonalBidRuleMilestone("code-410", "title-416");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
