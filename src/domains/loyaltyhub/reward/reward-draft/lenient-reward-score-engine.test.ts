import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientRewardScoreEngine } from "./lenient-reward-score-engine.js";
import { newLenientRewardScore } from "./lenient-reward-score.js";

test("LenientRewardScoreEngine keeps results within bounds", () => {
  const engine = defaultLenientRewardScoreEngine();
  const item = newLenientRewardScore("code-128", "title-914");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
