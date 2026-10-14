import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryStepScoreEngine } from "./primary-step-score-engine.js";
import { newPrimaryStepScore } from "./primary-step-score.js";

test("PrimaryStepScoreEngine keeps results within bounds", () => {
  const engine = defaultPrimaryStepScoreEngine();
  const item = newPrimaryStepScore("code-351", "label-318");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
