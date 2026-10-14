import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingSenderQuotaStore } from "./rolling-sender-quota-store.js";
import { newRollingSenderQuota } from "./rolling-sender-quota.js";

test("MemoryRollingSenderQuotaStore finds what it saved", () => {
  const store = newMemoryRollingSenderQuotaStore();
  const item = newRollingSenderQuota("code-411", "name-934");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
