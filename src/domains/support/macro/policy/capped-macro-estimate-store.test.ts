import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedMacroEstimateStore } from "./capped-macro-estimate-store.js";
import { newCappedMacroEstimate } from "./capped-macro-estimate.js";

test("MemoryCappedMacroEstimateStore finds what it saved", () => {
  const store = newMemoryCappedMacroEstimateStore();
  const item = newCappedMacroEstimate("code-861", "label-856");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
