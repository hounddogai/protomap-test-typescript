import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintScoreEngine } from "./complaint-score-engine.js";
import { newComplaintScore } from "./complaint-score.js";

test("ComplaintScoreEngine keeps results within bounds", () => {
  const engine = defaultComplaintScoreEngine();
  const item = newComplaintScore("code-172", "title-759");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
