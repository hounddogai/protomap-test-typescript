import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredSenderMappingStore } from "./tiered-sender-mapping-store.js";
import { newTieredSenderMapping } from "./tiered-sender-mapping.js";

test("MemoryTieredSenderMappingStore finds what it saved", () => {
  const store = newMemoryTieredSenderMappingStore();
  const item = newTieredSenderMapping("code-183", "name-524");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
