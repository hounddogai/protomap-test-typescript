import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackMacroOverrideStore } from "./fallback-macro-override-store.js";
import { newFallbackMacroOverride } from "./fallback-macro-override.js";

test("MemoryFallbackMacroOverrideStore finds what it saved", () => {
  const store = newMemoryFallbackMacroOverrideStore();
  const item = newFallbackMacroOverride("code-995", "title-834");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
