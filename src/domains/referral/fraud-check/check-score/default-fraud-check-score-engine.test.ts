import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultFraudCheckScoreEngine } from "./default-fraud-check-score-engine.js";
import { newDefaultFraudCheckScore } from "./default-fraud-check-score.js";

test("DefaultFraudCheckScoreEngine keeps results within bounds", () => {
  const engine = defaultDefaultFraudCheckScoreEngine();
  const item = newDefaultFraudCheckScore("code-2", "label-586");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
