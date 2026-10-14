import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalApprovalAgreementStore } from "./regional-approval-agreement-store.js";
import { newRegionalApprovalAgreement } from "./regional-approval-agreement.js";

test("MemoryRegionalApprovalAgreementStore finds what it saved", () => {
  const store = newMemoryRegionalApprovalAgreementStore();
  const item = newRegionalApprovalAgreement("code-901", "label-930");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
