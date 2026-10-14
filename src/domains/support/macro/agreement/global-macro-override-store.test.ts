import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalMacroOverrideStore } from "./global-macro-override-store.js";
import { newGlobalMacroOverride } from "./global-macro-override.js";

test("MemoryGlobalMacroOverrideStore finds what it saved", () => {
  const store = newMemoryGlobalMacroOverrideStore();
  const item = newGlobalMacroOverride("code-194", "label-578");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
