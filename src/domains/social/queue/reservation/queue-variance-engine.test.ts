import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultQueueVarianceEngine } from "./queue-variance-engine.js";
import { newQueueVariance } from "./queue-variance.js";

test("QueueVarianceEngine keeps results within bounds", () => {
  const engine = defaultQueueVarianceEngine(flags.newRegistry());
  const item = newQueueVariance("code-986", "label-319");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
