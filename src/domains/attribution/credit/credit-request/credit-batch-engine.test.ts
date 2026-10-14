import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditBatchEngine } from "./credit-batch-engine.js";
import { newCreditBatch } from "./credit-batch.js";

test("CreditBatchEngine keeps results within bounds", () => {
  const engine = defaultCreditBatchEngine(flags.newRegistry());
  const item = newCreditBatch("code-868", "name-943");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
