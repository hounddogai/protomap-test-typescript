import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionBaselineStore } from "./redemption-baseline-store.js";
import { newRedemptionBaseline } from "./redemption-baseline.js";

test("MemoryRedemptionBaselineStore finds what it saved", () => {
  const store = newMemoryRedemptionBaselineStore();
  const item = newRedemptionBaseline("code-358", "label-251");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
