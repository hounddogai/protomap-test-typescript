import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionQuotaStore } from "./suppression-quota-store.js";
import { newSuppressionQuota } from "./suppression-quota.js";

test("MemorySuppressionQuotaStore finds what it saved", () => {
  const store = newMemorySuppressionQuotaStore();
  const item = newSuppressionQuota("code-455", "label-188");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
