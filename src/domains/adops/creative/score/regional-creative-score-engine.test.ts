import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalCreativeScoreEngine } from "./regional-creative-score-engine.js";
import { newRegionalCreativeScore } from "./regional-creative-score.js";

test("RegionalCreativeScoreEngine keeps results within bounds", () => {
  const engine = defaultRegionalCreativeScoreEngine();
  const item = newRegionalCreativeScore("code-152", "name-823");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
