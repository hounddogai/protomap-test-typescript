import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalRequestStore } from "./approval-request-store.js";
import { newApprovalRequest } from "./approval-request.js";

test("MemoryApprovalRequestStore finds what it saved", () => {
  const store = newMemoryApprovalRequestStore();
  const item = newApprovalRequest("code-272", "name-815");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
