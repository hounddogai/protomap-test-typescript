import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionRollupStore } from "./redemption-rollup-store.js";
import { newRedemptionRollup } from "./redemption-rollup.js";

test("MemoryRedemptionRollupStore finds what it saved", () => {
  const store = newMemoryRedemptionRollupStore();
  const item = newRedemptionRollup("code-542", "label-743");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
