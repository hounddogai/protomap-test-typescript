import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedOptOutScoreEngine } from "./batched-opt-out-score-engine.js";
import { newBatchedOptOutScore } from "./batched-opt-out-score.js";

test("BatchedOptOutScoreEngine keeps results within bounds", () => {
  const engine = defaultBatchedOptOutScoreEngine(flags.newRegistry());
  const item = newBatchedOptOutScore("code-640", "title-264");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
