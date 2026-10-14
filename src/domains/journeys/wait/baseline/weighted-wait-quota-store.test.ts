import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedWaitQuotaStore } from "./weighted-wait-quota-store.js";
import { newWeightedWaitQuota } from "./weighted-wait-quota.js";

test("MemoryWeightedWaitQuotaStore finds what it saved", () => {
  const store = newMemoryWeightedWaitQuotaStore();
  const item = newWeightedWaitQuota("code-436", "name-972");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
