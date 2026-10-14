import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditMappingStore } from "./credit-mapping-store.js";
import { newCreditMapping } from "./credit-mapping.js";

test("MemoryCreditMappingStore finds what it saved", () => {
  const store = newMemoryCreditMappingStore();
  const item = newCreditMapping("code-102", "name-173");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
