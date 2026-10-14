import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFraudCheckBatchEngine } from "./fraud-check-batch-engine.js";
import { newFraudCheckBatch } from "./fraud-check-batch.js";

test("FraudCheckBatchEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckBatchEngine(flags.newRegistry());
  const item = newFraudCheckBatch("code-587", "label-305");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
