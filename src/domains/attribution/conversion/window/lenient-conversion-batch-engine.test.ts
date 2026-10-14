import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientConversionBatchEngine } from "./lenient-conversion-batch-engine.js";
import { newLenientConversionBatch } from "./lenient-conversion-batch.js";

test("LenientConversionBatchEngine keeps results within bounds", () => {
  const engine = defaultLenientConversionBatchEngine(flags.newRegistry());
  const item = newLenientConversionBatch("code-511", "title-118");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
