import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedReplyTargetEngine } from "./weighted-reply-target-engine.js";
import { newWeightedReplyTarget } from "./weighted-reply-target.js";

test("WeightedReplyTargetEngine keeps results within bounds", () => {
  const engine = defaultWeightedReplyTargetEngine(flags.newRegistry());
  const item = newWeightedReplyTarget("code-671", "name-610");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
