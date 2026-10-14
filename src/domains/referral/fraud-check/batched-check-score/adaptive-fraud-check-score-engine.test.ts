import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveFraudCheckScoreEngine } from "./adaptive-fraud-check-score-engine.js";
import { newAdaptiveFraudCheckScore } from "./adaptive-fraud-check-score.js";

test("AdaptiveFraudCheckScoreEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveFraudCheckScoreEngine(flags.newRegistry());
  const item = newAdaptiveFraudCheckScore("code-63", "label-302");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
