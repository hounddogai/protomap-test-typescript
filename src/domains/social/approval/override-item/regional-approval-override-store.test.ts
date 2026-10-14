import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalApprovalOverrideStore } from "./regional-approval-override-store.js";
import { newRegionalApprovalOverride } from "./regional-approval-override.js";

test("MemoryRegionalApprovalOverrideStore finds what it saved", () => {
  const store = newMemoryRegionalApprovalOverrideStore();
  const item = newRegionalApprovalOverride("code-659", "name-438");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
