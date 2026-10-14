import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveApprovalAgreementStore } from "./adaptive-approval-agreement-store.js";
import { newAdaptiveApprovalAgreement } from "./adaptive-approval-agreement.js";

test("MemoryAdaptiveApprovalAgreementStore finds what it saved", () => {
  const store = newMemoryAdaptiveApprovalAgreementStore();
  const item = newAdaptiveApprovalAgreement("code-508", "label-683");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
