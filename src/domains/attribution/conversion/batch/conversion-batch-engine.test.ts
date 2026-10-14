import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionBatchEngine } from "./conversion-batch-engine.js";
import { newConversionBatch } from "./conversion-batch.js";

test("ConversionBatchEngine keeps results within bounds", () => {
  const engine = defaultConversionBatchEngine(flags.newRegistry());
  const item = newConversionBatch("code-222", "label-203");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
