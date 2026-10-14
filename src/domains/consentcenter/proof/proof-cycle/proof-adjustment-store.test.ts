import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofAdjustmentStore } from "./proof-adjustment-store.js";
import { newProofAdjustment } from "./proof-adjustment.js";

test("MemoryProofAdjustmentStore finds what it saved", () => {
  const store = newMemoryProofAdjustmentStore();
  const item = newProofAdjustment("code-603", "title-264");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
