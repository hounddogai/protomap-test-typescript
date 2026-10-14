import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientDomainRequestStore } from "./lenient-domain-request-store.js";
import { newLenientDomainRequest } from "./lenient-domain-request.js";

test("MemoryLenientDomainRequestStore finds what it saved", () => {
  const store = newMemoryLenientDomainRequestStore();
  const item = newLenientDomainRequest("code-31", "name-633");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
