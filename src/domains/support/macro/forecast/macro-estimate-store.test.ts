import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroEstimateStore } from "./macro-estimate-store.js";
import { newMacroEstimate } from "./macro-estimate.js";

test("MemoryMacroEstimateStore finds what it saved", () => {
  const store = newMemoryMacroEstimateStore();
  const item = newMacroEstimate("code-69", "title-846");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
