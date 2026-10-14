import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictProofAdjustmentStore } from "./strict-proof-adjustment-store.js";
import { newStrictProofAdjustment } from "./strict-proof-adjustment.js";

test("MemoryStrictProofAdjustmentStore finds what it saved", () => {
  const store = newMemoryStrictProofAdjustmentStore();
  const item = newStrictProofAdjustment("code-788", "title-279");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
