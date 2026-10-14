import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalQuotaEngine } from "./approval-quota-engine.js";
import { newApprovalQuota } from "./approval-quota.js";

test("ApprovalQuotaEngine keeps results within bounds", () => {
  const engine = defaultApprovalQuotaEngine();
  const item = newApprovalQuota("code-648", "label-208");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
