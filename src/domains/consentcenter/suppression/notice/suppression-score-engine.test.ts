import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSuppressionScoreEngine } from "./suppression-score-engine.js";
import { newSuppressionScore } from "./suppression-score.js";

test("SuppressionScoreEngine keeps results within bounds", () => {
  const engine = defaultSuppressionScoreEngine();
  const item = newSuppressionScore("code-985", "label-637");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
