import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalProfileStore } from "./approval-profile-store.js";
import { newApprovalProfile } from "./approval-profile.js";

test("MemoryApprovalProfileStore finds what it saved", () => {
  const store = newMemoryApprovalProfileStore();
  const item = newApprovalProfile("code-833", "label-946");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
