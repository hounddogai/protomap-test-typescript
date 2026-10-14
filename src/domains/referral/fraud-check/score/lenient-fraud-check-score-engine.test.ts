import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientFraudCheckScoreEngine } from "./lenient-fraud-check-score-engine.js";
import { newLenientFraudCheckScore } from "./lenient-fraud-check-score.js";

test("LenientFraudCheckScoreEngine keeps results within bounds", () => {
  const engine = defaultLenientFraudCheckScoreEngine(flags.newRegistry());
  const item = newLenientFraudCheckScore("code-126", "label-799");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
