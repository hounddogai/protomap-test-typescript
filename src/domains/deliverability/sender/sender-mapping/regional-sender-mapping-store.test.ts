import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSenderMappingStore } from "./regional-sender-mapping-store.js";
import { newRegionalSenderMapping } from "./regional-sender-mapping.js";

test("MemoryRegionalSenderMappingStore finds what it saved", () => {
  const store = newMemoryRegionalSenderMappingStore();
  const item = newRegionalSenderMapping("code-569", "label-347");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
