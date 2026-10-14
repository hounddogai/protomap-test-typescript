import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledCreditRollupStore } from "./scheduled-credit-rollup-store.js";
import { newScheduledCreditRollup } from "./scheduled-credit-rollup.js";

test("MemoryScheduledCreditRollupStore finds what it saved", () => {
  const store = newMemoryScheduledCreditRollupStore();
  const item = newScheduledCreditRollup("code-570", "title-280");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
