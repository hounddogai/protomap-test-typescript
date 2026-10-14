import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualWaitQuotaStore } from "./manual-wait-quota-store.js";
import { newManualWaitQuota } from "./manual-wait-quota.js";

test("MemoryManualWaitQuotaStore finds what it saved", () => {
  const store = newMemoryManualWaitQuotaStore();
  const item = newManualWaitQuota("code-623", "name-833");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
