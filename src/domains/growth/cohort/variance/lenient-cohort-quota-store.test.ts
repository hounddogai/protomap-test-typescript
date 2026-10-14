import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientCohortQuotaStore } from "./lenient-cohort-quota-store.js";
import { newLenientCohortQuota } from "./lenient-cohort-quota.js";

test("MemoryLenientCohortQuotaStore finds what it saved", () => {
  const store = newMemoryLenientCohortQuotaStore();
  const item = newLenientCohortQuota("code-78", "name-308");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
