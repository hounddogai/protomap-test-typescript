import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyCsatQuotaStore } from "./legacy-csat-quota-store.js";
import { newLegacyCsatQuota } from "./legacy-csat-quota.js";

test("MemoryLegacyCsatQuotaStore finds what it saved", () => {
  const store = newMemoryLegacyCsatQuotaStore();
  const item = newLegacyCsatQuota("code-835", "label-509");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
