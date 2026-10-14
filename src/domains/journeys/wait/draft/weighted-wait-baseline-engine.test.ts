import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedWaitBaselineEngine } from "./weighted-wait-baseline-engine.js";
import { newWeightedWaitBaseline } from "./weighted-wait-baseline.js";

test("WeightedWaitBaselineEngine keeps results within bounds", () => {
  const engine = defaultWeightedWaitBaselineEngine(flags.newRegistry());
  const item = newWeightedWaitBaseline("code-414", "title-906");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
