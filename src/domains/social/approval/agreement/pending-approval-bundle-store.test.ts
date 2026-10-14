import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingApprovalBundleStore } from "./pending-approval-bundle-store.js";
import { newPendingApprovalBundle } from "./pending-approval-bundle.js";

test("MemoryPendingApprovalBundleStore finds what it saved", () => {
  const store = newMemoryPendingApprovalBundleStore();
  const item = newPendingApprovalBundle("code-714", "title-347");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
