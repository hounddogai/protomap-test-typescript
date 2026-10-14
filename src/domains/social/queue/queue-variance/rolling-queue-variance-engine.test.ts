import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingQueueVarianceEngine } from "./rolling-queue-variance-engine.js";
import { newRollingQueueVariance } from "./rolling-queue-variance.js";

test("RollingQueueVarianceEngine keeps results within bounds", () => {
  const engine = defaultRollingQueueVarianceEngine(flags.newRegistry());
  const item = newRollingQueueVariance("code-885", "label-664");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
