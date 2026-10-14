import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainEntryStore } from "./domain-entry-store.js";
import { newDomainEntry } from "./domain-entry.js";

test("MemoryDomainEntryStore finds what it saved", () => {
  const store = newMemoryDomainEntryStore();
  const item = newDomainEntry("code-247", "name-817");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
