import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDomainRequestStore } from "./scheduled-domain-request-store.js";
import { newScheduledDomainRequest } from "./scheduled-domain-request.js";

test("MemoryScheduledDomainRequestStore finds what it saved", () => {
  const store = newMemoryScheduledDomainRequestStore();
  const item = newScheduledDomainRequest("code-927", "name-329");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
