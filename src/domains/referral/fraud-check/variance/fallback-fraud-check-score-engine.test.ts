import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackFraudCheckScoreEngine } from "./fallback-fraud-check-score-engine.js";
import { newFallbackFraudCheckScore } from "./fallback-fraud-check-score.js";

test("FallbackFraudCheckScoreEngine keeps results within bounds", () => {
  const engine = defaultFallbackFraudCheckScoreEngine(flags.newRegistry());
  const item = newFallbackFraudCheckScore("code-864", "title-482");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
