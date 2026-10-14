import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPathQuotaStore } from "./weighted-path-quota-store.js";
import { newWeightedPathQuota } from "./weighted-path-quota.js";

test("MemoryWeightedPathQuotaStore finds what it saved", () => {
  const store = newMemoryWeightedPathQuotaStore();
  const item = newWeightedPathQuota("code-123", "title-328");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
