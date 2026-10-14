import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveDomainGroupStore } from "./adaptive-domain-group-store.js";
import { newAdaptiveDomainGroup } from "./adaptive-domain-group.js";

test("MemoryAdaptiveDomainGroupStore finds what it saved", () => {
  const store = newMemoryAdaptiveDomainGroupStore();
  const item = newAdaptiveDomainGroup("code-430", "title-300");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
