import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictQueueVarianceEngine } from "./strict-queue-variance-engine.js";
import { newStrictQueueVariance } from "./strict-queue-variance.js";

test("StrictQueueVarianceEngine keeps results within bounds", () => {
  const engine = defaultStrictQueueVarianceEngine(flags.newRegistry());
  const item = newStrictQueueVariance("code-902", "name-372");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
