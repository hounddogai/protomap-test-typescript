import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroBaselineStore } from "./macro-baseline-store.js";
import { newMacroBaseline } from "./macro-baseline.js";

test("MemoryMacroBaselineStore finds what it saved", () => {
  const store = newMemoryMacroBaselineStore();
  const item = newMacroBaseline("code-628", "label-688");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
