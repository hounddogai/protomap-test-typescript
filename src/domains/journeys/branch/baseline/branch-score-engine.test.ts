import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchScoreEngine } from "./branch-score-engine.js";
import { newBranchScore } from "./branch-score.js";

test("BranchScoreEngine keeps results within bounds", () => {
  const engine = defaultBranchScoreEngine();
  const item = newBranchScore("code-192", "title-673");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
