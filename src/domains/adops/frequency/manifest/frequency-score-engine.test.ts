import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFrequencyScoreEngine } from "./frequency-score-engine.js";
import { newFrequencyScore } from "./frequency-score.js";

test("FrequencyScoreEngine keeps results within bounds", () => {
  const engine = defaultFrequencyScoreEngine();
  const item = newFrequencyScore("code-173", "label-723");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
