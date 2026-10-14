import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientOptOutScoreEngine } from "./lenient-opt-out-score-engine.js";
import { newLenientOptOutScore } from "./lenient-opt-out-score.js";

test("LenientOptOutScoreEngine keeps results within bounds", () => {
  const engine = defaultLenientOptOutScoreEngine(flags.newRegistry());
  const item = newLenientOptOutScore("code-757", "label-814");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
