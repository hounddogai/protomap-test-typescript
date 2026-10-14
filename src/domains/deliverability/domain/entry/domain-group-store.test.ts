import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainGroupStore } from "./domain-group-store.js";
import { newDomainGroup } from "./domain-group.js";

test("MemoryDomainGroupStore finds what it saved", () => {
  const store = newMemoryDomainGroupStore();
  const item = newDomainGroup("code-641", "label-219");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
