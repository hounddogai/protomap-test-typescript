import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryApprovalAgreementStore } from "./approval-agreement-store.js";
import { newApprovalAgreement } from "./approval-agreement.js";

test("MemoryApprovalAgreementStore finds what it saved", () => {
  const store = newMemoryApprovalAgreementStore();
  const item = newApprovalAgreement("code-551", "name-347");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
