import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalCreditRequestStore } from "./regional-credit-request-store.js";
import { newRegionalCreditRequest } from "./regional-credit-request.js";

test("MemoryRegionalCreditRequestStore finds what it saved", () => {
  const store = newMemoryRegionalCreditRequestStore();
  const item = newRegionalCreditRequest("code-520", "name-937");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
