import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedMacroScoreEngine } from "./batched-macro-score-engine.js";
import { newBatchedMacroScore } from "./batched-macro-score.js";

test("BatchedMacroScoreEngine keeps results within bounds", () => {
  const engine = defaultBatchedMacroScoreEngine(flags.newRegistry());
  const item = newBatchedMacroScore("code-702", "name-673");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
