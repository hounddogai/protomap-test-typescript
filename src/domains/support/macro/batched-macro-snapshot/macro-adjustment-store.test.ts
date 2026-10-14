import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroAdjustmentStore } from "./macro-adjustment-store.js";
import { newMacroAdjustment } from "./macro-adjustment.js";

test("MemoryMacroAdjustmentStore finds what it saved", () => {
  const store = newMemoryMacroAdjustmentStore();
  const item = newMacroAdjustment("code-491", "title-880");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
