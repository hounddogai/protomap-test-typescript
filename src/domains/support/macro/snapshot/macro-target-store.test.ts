import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroTargetStore } from "./macro-target-store.js";
import { newMacroTarget } from "./macro-target.js";

test("MemoryMacroTargetStore finds what it saved", () => {
  const store = newMemoryMacroTargetStore();
  const item = newMacroTarget("code-667", "name-931");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
