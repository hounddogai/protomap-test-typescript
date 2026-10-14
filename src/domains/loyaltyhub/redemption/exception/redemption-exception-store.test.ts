import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionExceptionStore } from "./redemption-exception-store.js";
import { newRedemptionException } from "./redemption-exception.js";

test("MemoryRedemptionExceptionStore finds what it saved", () => {
  const store = newMemoryRedemptionExceptionStore();
  const item = newRedemptionException("code-628", "title-128");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
