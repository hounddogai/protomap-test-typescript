import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingApprovalAgreementStore } from "./pending-approval-agreement-store.js";
import { newPendingApprovalAgreement } from "./pending-approval-agreement.js";

test("MemoryPendingApprovalAgreementStore finds what it saved", () => {
  const store = newMemoryPendingApprovalAgreementStore();
  const item = newPendingApprovalAgreement("code-915", "label-938");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
