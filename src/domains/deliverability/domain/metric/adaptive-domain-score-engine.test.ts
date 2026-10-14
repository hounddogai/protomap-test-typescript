import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveDomainScoreEngine } from "./adaptive-domain-score-engine.js";
import { newAdaptiveDomainScore } from "./adaptive-domain-score.js";

test("AdaptiveDomainScoreEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveDomainScoreEngine(flags.newRegistry());
  const item = newAdaptiveDomainScore("code-362", "name-173");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
