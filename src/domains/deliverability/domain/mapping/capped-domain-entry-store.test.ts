import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedDomainEntryStore } from "./capped-domain-entry-store.js";
import { newCappedDomainEntry } from "./capped-domain-entry.js";

test("MemoryCappedDomainEntryStore finds what it saved", () => {
  const store = newMemoryCappedDomainEntryStore();
  const item = newCappedDomainEntry("code-856", "name-165");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
