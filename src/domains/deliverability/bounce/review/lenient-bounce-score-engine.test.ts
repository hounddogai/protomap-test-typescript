import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientBounceScoreEngine } from "./lenient-bounce-score-engine.js";
import { newLenientBounceScore } from "./lenient-bounce-score.js";

test("LenientBounceScoreEngine keeps results within bounds", () => {
  const engine = defaultLenientBounceScoreEngine(flags.newRegistry());
  const item = newLenientBounceScore("code-999", "title-268");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
