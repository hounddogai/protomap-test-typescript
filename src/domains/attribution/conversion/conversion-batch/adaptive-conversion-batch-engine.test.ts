import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveConversionBatchEngine } from "./adaptive-conversion-batch-engine.js";
import { newAdaptiveConversionBatch } from "./adaptive-conversion-batch.js";

test("AdaptiveConversionBatchEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveConversionBatchEngine(flags.newRegistry());
  const item = newAdaptiveConversionBatch("code-274", "name-630");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
