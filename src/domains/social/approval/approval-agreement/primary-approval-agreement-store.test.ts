import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryApprovalAgreementStore } from "./primary-approval-agreement-store.js";
import { newPrimaryApprovalAgreement } from "./primary-approval-agreement.js";

test("MemoryPrimaryApprovalAgreementStore finds what it saved", () => {
  const store = newMemoryPrimaryApprovalAgreementStore();
  const item = newPrimaryApprovalAgreement("code-553", "name-932");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
