import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalApprovalScoreEngine } from "./seasonal-approval-score-engine.js";
import { newSeasonalApprovalScore } from "./seasonal-approval-score.js";

test("SeasonalApprovalScoreEngine keeps results within bounds", () => {
  const engine = defaultSeasonalApprovalScoreEngine();
  const item = newSeasonalApprovalScore("code-812", "name-682");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
