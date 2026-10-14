import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFallbackPostScoreEngine } from "./fallback-post-score-engine.js";
import { newFallbackPostScore } from "./fallback-post-score.js";

test("FallbackPostScoreEngine keeps results within bounds", () => {
  const engine = defaultFallbackPostScoreEngine();
  const item = newFallbackPostScore("code-221", "title-810");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
