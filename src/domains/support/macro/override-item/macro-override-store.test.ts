import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroOverrideStore } from "./macro-override-store.js";
import { newMacroOverride } from "./macro-override.js";

test("MemoryMacroOverrideStore finds what it saved", () => {
  const store = newMemoryMacroOverrideStore();
  const item = newMacroOverride("code-212", "label-715");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
