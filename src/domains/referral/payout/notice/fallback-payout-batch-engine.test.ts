import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackPayoutBatchEngine } from "./fallback-payout-batch-engine.js";
import { newFallbackPayoutBatch } from "./fallback-payout-batch.js";

test("FallbackPayoutBatchEngine keeps results within bounds", () => {
  const engine = defaultFallbackPayoutBatchEngine(flags.newRegistry());
  const item = newFallbackPayoutBatch("code-566", "title-57");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
