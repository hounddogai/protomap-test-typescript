import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInsightScoreEngine } from "./insight-score-engine.js";
import { newInsightScore } from "./insight-score.js";

test("InsightScoreEngine keeps results within bounds", () => {
  const engine = defaultInsightScoreEngine();
  const item = newInsightScore("code-299", "title-480");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
