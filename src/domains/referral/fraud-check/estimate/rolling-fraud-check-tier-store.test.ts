import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingFraudCheckTierStore } from "./rolling-fraud-check-tier-store.js";
import { newRollingFraudCheckTier } from "./rolling-fraud-check-tier.js";

test("MemoryRollingFraudCheckTierStore finds what it saved", () => {
  const store = newMemoryRollingFraudCheckTierStore();
  const item = newRollingFraudCheckTier("code-290", "name-161");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
