import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteQuotaEngine } from "./invite-quota-engine.js";
import { newInviteQuota } from "./invite-quota.js";

test("InviteQuotaEngine keeps results within bounds", () => {
  const engine = defaultInviteQuotaEngine();
  const item = newInviteQuota("code-888", "title-684");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
