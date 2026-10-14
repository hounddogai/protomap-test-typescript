import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledRetentionScoreEngine } from "./scheduled-retention-score-engine.js";
import { newScheduledRetentionScore } from "./scheduled-retention-score.js";

test("ScheduledRetentionScoreEngine keeps results within bounds", () => {
  const engine = defaultScheduledRetentionScoreEngine();
  const item = newScheduledRetentionScore("code-182", "label-530");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
