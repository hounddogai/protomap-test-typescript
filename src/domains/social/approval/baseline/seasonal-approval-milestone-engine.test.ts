import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalApprovalMilestoneEngine } from "./seasonal-approval-milestone-engine.js";
import { newSeasonalApprovalMilestone } from "./seasonal-approval-milestone.js";

test("SeasonalApprovalMilestoneEngine keeps results within bounds", () => {
  const engine = defaultSeasonalApprovalMilestoneEngine();
  const item = newSeasonalApprovalMilestone("code-158", "title-200");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
