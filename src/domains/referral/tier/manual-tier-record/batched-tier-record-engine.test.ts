import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedTierRecordEngine } from "./batched-tier-record-engine.js";
import { newBatchedTierRecord } from "./batched-tier-record.js";

test("BatchedTierRecordEngine keeps results within bounds", () => {
  const engine = defaultBatchedTierRecordEngine(flags.newRegistry());
  const item = newBatchedTierRecord("code-334", "label-136");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
