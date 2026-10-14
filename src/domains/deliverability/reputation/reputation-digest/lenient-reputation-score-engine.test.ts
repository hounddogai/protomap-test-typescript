import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientReputationScoreEngine } from "./lenient-reputation-score-engine.js";
import { newLenientReputationScore } from "./lenient-reputation-score.js";

test("LenientReputationScoreEngine keeps results within bounds", () => {
  const engine = defaultLenientReputationScoreEngine();
  const item = newLenientReputationScore("code-923", "title-767");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
