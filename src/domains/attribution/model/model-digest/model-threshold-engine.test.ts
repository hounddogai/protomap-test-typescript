import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelThresholdEngine } from "./model-threshold-engine.js";
import { newModelThreshold } from "./model-threshold.js";

test("ModelThresholdEngine keeps results within bounds", () => {
  const engine = defaultModelThresholdEngine(flags.newRegistry());
  const item = newModelThreshold("code-797", "label-321");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
