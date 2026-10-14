import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEnrollmentQuotaStore } from "./enrollment-quota-store.js";
import { newEnrollmentQuota } from "./enrollment-quota.js";

test("MemoryEnrollmentQuotaStore finds what it saved", () => {
  const store = newMemoryEnrollmentQuotaStore();
  const item = newEnrollmentQuota("code-139", "label-828");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
