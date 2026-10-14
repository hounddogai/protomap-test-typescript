import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedApprovalQuotaEngine } from "./batched-approval-quota-engine.js";
import { newBatchedApprovalQuota } from "./batched-approval-quota.js";

test("BatchedApprovalQuotaEngine keeps results within bounds", () => {
  const engine = defaultBatchedApprovalQuotaEngine(flags.newRegistry());
  const item = newBatchedApprovalQuota("code-929", "title-128");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
