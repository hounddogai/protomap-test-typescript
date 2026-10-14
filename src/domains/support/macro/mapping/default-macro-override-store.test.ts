import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultMacroOverrideStore } from "./default-macro-override-store.js";
import { newDefaultMacroOverride } from "./default-macro-override.js";

test("MemoryDefaultMacroOverrideStore finds what it saved", () => {
  const store = newMemoryDefaultMacroOverrideStore();
  const item = newDefaultMacroOverride("code-491", "title-953");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
