import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredMacroPolicyStore } from "./tiered-macro-policy-store.js";
import { newTieredMacroPolicy } from "./tiered-macro-policy.js";

test("MemoryTieredMacroPolicyStore finds what it saved", () => {
  const store = newMemoryTieredMacroPolicyStore();
  const item = newTieredMacroPolicy("code-5", "name-589");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
