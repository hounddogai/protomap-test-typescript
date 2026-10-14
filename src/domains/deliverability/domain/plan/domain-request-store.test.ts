import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainRequestStore } from "./domain-request-store.js";
import { newDomainRequest } from "./domain-request.js";

test("MemoryDomainRequestStore finds what it saved", () => {
  const store = newMemoryDomainRequestStore();
  const item = newDomainRequest("code-28", "title-669");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
