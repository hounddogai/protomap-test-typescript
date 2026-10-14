import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictMacroQuotaStore } from "./strict-macro-quota-store.js";
import { newStrictMacroQuota } from "./strict-macro-quota.js";

test("MemoryStrictMacroQuotaStore finds what it saved", () => {
  const store = newMemoryStrictMacroQuotaStore();
  const item = newStrictMacroQuota("code-248", "label-796");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
