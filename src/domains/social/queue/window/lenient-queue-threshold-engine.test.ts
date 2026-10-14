import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientQueueThresholdEngine } from "./lenient-queue-threshold-engine.js";
import { newLenientQueueThreshold } from "./lenient-queue-threshold.js";

test("LenientQueueThresholdEngine keeps results within bounds", () => {
  const engine = defaultLenientQueueThresholdEngine(flags.newRegistry());
  const item = newLenientQueueThreshold("code-81", "title-704");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
