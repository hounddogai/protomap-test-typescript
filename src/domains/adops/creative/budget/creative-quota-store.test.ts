import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeQuotaStore } from "./creative-quota-store.js";
import { newCreativeQuota } from "./creative-quota.js";

test("MemoryCreativeQuotaStore finds what it saved", () => {
  const store = newMemoryCreativeQuotaStore();
  const item = newCreativeQuota("code-780", "name-913");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
