import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingPayoutBatchEngine } from "./rolling-payout-batch-engine.js";
import { newRollingPayoutBatch } from "./rolling-payout-batch.js";

test("RollingPayoutBatchEngine keeps results within bounds", () => {
  const engine = defaultRollingPayoutBatchEngine(flags.newRegistry());
  const item = newRollingPayoutBatch("code-239", "name-896");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
