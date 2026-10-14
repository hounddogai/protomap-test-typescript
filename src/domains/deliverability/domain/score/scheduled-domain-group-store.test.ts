import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledDomainGroupStore } from "./scheduled-domain-group-store.js";
import { newScheduledDomainGroup } from "./scheduled-domain-group.js";

test("MemoryScheduledDomainGroupStore finds what it saved", () => {
  const store = newMemoryScheduledDomainGroupStore();
  const item = newScheduledDomainGroup("code-588", "name-953");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
