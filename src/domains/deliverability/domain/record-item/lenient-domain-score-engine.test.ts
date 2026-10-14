import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientDomainScoreEngine } from "./lenient-domain-score-engine.js";
import { newLenientDomainScore } from "./lenient-domain-score.js";

test("LenientDomainScoreEngine keeps results within bounds", () => {
  const engine = defaultLenientDomainScoreEngine();
  const item = newLenientDomainScore("code-208", "label-987");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
