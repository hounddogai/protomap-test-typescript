import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackApprovalQuotaEngine } from "./fallback-approval-quota-engine.js";
import { newFallbackApprovalQuota } from "./fallback-approval-quota.js";

test("FallbackApprovalQuotaEngine keeps results within bounds", () => {
  const engine = defaultFallbackApprovalQuotaEngine(flags.newRegistry());
  const item = newFallbackApprovalQuota("code-958", "name-369");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
