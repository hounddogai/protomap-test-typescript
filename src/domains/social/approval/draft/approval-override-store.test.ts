import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalOverrideStore } from "./approval-override-store.js";
import { newApprovalOverride } from "./approval-override.js";

test("MemoryApprovalOverrideStore finds what it saved", () => {
  const store = newMemoryApprovalOverrideStore();
  const item = newApprovalOverride("code-751", "title-427");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
