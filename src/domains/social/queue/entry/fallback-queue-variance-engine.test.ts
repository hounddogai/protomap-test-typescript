import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackQueueVarianceEngine } from "./fallback-queue-variance-engine.js";
import { newFallbackQueueVariance } from "./fallback-queue-variance.js";

test("FallbackQueueVarianceEngine keeps results within bounds", () => {
  const engine = defaultFallbackQueueVarianceEngine(flags.newRegistry());
  const item = newFallbackQueueVariance("code-626", "label-726");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
