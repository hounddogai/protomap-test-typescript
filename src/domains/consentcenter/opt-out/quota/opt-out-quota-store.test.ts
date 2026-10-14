import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutQuotaStore } from "./opt-out-quota-store.js";
import { newOptOutQuota } from "./opt-out-quota.js";

test("MemoryOptOutQuotaStore finds what it saved", () => {
  const store = newMemoryOptOutQuotaStore();
  const item = newOptOutQuota("code-605", "title-309");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
