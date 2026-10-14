import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditRequestStore } from "./credit-request-store.js";
import { newCreditRequest } from "./credit-request.js";

test("MemoryCreditRequestStore finds what it saved", () => {
  const store = newMemoryCreditRequestStore();
  const item = newCreditRequest("code-320", "label-517");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
