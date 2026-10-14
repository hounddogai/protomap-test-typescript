import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryMacroQuotaStore } from "./primary-macro-quota-store.js";
import { newPrimaryMacroQuota } from "./primary-macro-quota.js";

test("MemoryPrimaryMacroQuotaStore finds what it saved", () => {
  const store = newMemoryPrimaryMacroQuotaStore();
  const item = newPrimaryMacroQuota("code-733", "name-255");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
