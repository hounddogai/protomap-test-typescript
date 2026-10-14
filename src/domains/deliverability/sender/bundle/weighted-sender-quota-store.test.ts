import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedSenderQuotaStore } from "./weighted-sender-quota-store.js";
import { newWeightedSenderQuota } from "./weighted-sender-quota.js";

test("MemoryWeightedSenderQuotaStore finds what it saved", () => {
  const store = newMemoryWeightedSenderQuotaStore();
  const item = newWeightedSenderQuota("code-297", "title-506");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
