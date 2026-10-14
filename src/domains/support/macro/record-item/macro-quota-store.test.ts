import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroQuotaStore } from "./macro-quota-store.js";
import { newMacroQuota } from "./macro-quota.js";

test("MemoryMacroQuotaStore finds what it saved", () => {
  const store = newMemoryMacroQuotaStore();
  const item = newMacroQuota("code-486", "name-538");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
