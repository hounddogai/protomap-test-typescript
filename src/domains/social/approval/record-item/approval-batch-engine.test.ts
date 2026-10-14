import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultApprovalBatchEngine } from "./approval-batch-engine.js";
import { newApprovalBatch } from "./approval-batch.js";

test("ApprovalBatchEngine keeps results within bounds", () => {
  const engine = defaultApprovalBatchEngine(flags.newRegistry());
  const item = newApprovalBatch("code-394", "name-51");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
