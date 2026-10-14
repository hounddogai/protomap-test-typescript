import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintQuotaStore } from "./complaint-quota-store.js";
import { newComplaintQuota } from "./complaint-quota.js";

test("MemoryComplaintQuotaStore finds what it saved", () => {
  const store = newMemoryComplaintQuotaStore();
  const item = newComplaintQuota("code-266", "name-865");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
