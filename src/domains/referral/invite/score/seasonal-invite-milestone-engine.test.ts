import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalInviteMilestoneEngine } from "./seasonal-invite-milestone-engine.js";
import { newSeasonalInviteMilestone } from "./seasonal-invite-milestone.js";

test("SeasonalInviteMilestoneEngine keeps results within bounds", () => {
  const engine = defaultSeasonalInviteMilestoneEngine();
  const item = newSeasonalInviteMilestone("code-821", "title-98");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
