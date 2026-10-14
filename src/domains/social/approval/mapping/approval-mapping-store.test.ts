import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalMappingStore } from "./approval-mapping-store.js";
import { newApprovalMapping } from "./approval-mapping.js";

test("MemoryApprovalMappingStore finds what it saved", () => {
  const store = newMemoryApprovalMappingStore();
  const item = newApprovalMapping("code-446", "label-888");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
