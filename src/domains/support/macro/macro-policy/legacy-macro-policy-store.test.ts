import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyMacroPolicyStore } from "./legacy-macro-policy-store.js";
import { newLegacyMacroPolicy } from "./legacy-macro-policy.js";

test("MemoryLegacyMacroPolicyStore finds what it saved", () => {
  const store = newMemoryLegacyMacroPolicyStore();
  const item = newLegacyMacroPolicy("code-645", "title-758");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
