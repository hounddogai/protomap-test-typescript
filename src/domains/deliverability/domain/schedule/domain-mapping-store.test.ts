import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainMappingStore } from "./domain-mapping-store.js";
import { newDomainMapping } from "./domain-mapping.js";

test("MemoryDomainMappingStore finds what it saved", () => {
  const store = newMemoryDomainMappingStore();
  const item = newDomainMapping("code-162", "label-25");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
