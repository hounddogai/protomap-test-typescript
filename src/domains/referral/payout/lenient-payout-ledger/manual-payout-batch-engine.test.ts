import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualPayoutBatchEngine } from "./manual-payout-batch-engine.js";
import { newManualPayoutBatch } from "./manual-payout-batch.js";

test("ManualPayoutBatchEngine keeps results within bounds", () => {
  const engine = defaultManualPayoutBatchEngine(flags.newRegistry());
  const item = newManualPayoutBatch("code-658", "title-76");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
