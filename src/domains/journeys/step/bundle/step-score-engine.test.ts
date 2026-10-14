import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStepScoreEngine } from "./step-score-engine.js";
import { newStepScore } from "./step-score.js";

test("StepScoreEngine keeps results within bounds", () => {
  const engine = defaultStepScoreEngine(flags.newRegistry());
  const item = newStepScore("code-615", "label-864");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
