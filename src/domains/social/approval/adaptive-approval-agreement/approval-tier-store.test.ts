import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalTierStore } from "./approval-tier-store.js";
import { newApprovalTier } from "./approval-tier.js";

test("MemoryApprovalTierStore finds what it saved", () => {
  const store = newMemoryApprovalTierStore();
  const item = newApprovalTier("code-509", "title-428");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
