import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultMacroBaselineStore } from "./default-macro-baseline-store.js";
import { newDefaultMacroBaseline } from "./default-macro-baseline.js";

test("MemoryDefaultMacroBaselineStore finds what it saved", () => {
  const store = newMemoryDefaultMacroBaselineStore();
  const item = newDefaultMacroBaseline("code-542", "name-696");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
