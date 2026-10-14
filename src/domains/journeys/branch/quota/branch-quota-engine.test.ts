import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchQuotaEngine } from "./branch-quota-engine.js";
import { newBranchQuota } from "./branch-quota.js";

test("BranchQuotaEngine keeps results within bounds", () => {
  const engine = defaultBranchQuotaEngine();
  const item = newBranchQuota("code-736", "title-952");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
