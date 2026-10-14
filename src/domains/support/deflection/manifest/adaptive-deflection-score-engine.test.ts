import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveDeflectionScoreEngine } from "./adaptive-deflection-score-engine.js";
import { newAdaptiveDeflectionScore } from "./adaptive-deflection-score.js";

test("AdaptiveDeflectionScoreEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveDeflectionScoreEngine();
  const item = newAdaptiveDeflectionScore("code-529", "title-690");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
