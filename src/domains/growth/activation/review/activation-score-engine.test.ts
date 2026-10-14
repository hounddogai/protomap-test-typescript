import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationScoreEngine } from "./activation-score-engine.js";
import { newActivationScore } from "./activation-score.js";

test("ActivationScoreEngine keeps results within bounds", () => {
  const engine = defaultActivationScoreEngine();
  const item = newActivationScore("code-913", "label-343");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
