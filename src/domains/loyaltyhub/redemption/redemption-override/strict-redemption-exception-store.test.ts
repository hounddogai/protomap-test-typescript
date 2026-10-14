import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictRedemptionExceptionStore } from "./strict-redemption-exception-store.js";
import { newStrictRedemptionException } from "./strict-redemption-exception.js";

test("MemoryStrictRedemptionExceptionStore finds what it saved", () => {
  const store = newMemoryStrictRedemptionExceptionStore();
  const item = newStrictRedemptionException("code-281", "title-424");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
