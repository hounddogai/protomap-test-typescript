import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackQueueThresholdEngine } from "./fallback-queue-threshold-engine.js";
import { newFallbackQueueThreshold } from "./fallback-queue-threshold.js";

test("FallbackQueueThresholdEngine keeps results within bounds", () => {
  const engine = defaultFallbackQueueThresholdEngine(flags.newRegistry());
  const item = newFallbackQueueThreshold("code-950", "label-36");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
