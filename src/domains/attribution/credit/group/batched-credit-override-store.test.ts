import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedCreditOverrideStore } from "./batched-credit-override-store.js";
import { newBatchedCreditOverride } from "./batched-credit-override.js";

test("MemoryBatchedCreditOverrideStore finds what it saved", () => {
  const store = newMemoryBatchedCreditOverrideStore();
  const item = newBatchedCreditOverride("code-12", "label-254");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
