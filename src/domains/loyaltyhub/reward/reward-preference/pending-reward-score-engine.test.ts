import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingRewardScoreEngine } from "./pending-reward-score-engine.js";
import { newPendingRewardScore } from "./pending-reward-score.js";

test("PendingRewardScoreEngine keeps results within bounds", () => {
  const engine = defaultPendingRewardScoreEngine();
  const item = newPendingRewardScore("code-430", "label-521");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
