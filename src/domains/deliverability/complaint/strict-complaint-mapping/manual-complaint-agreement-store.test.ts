import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualComplaintAgreementStore } from "./manual-complaint-agreement-store.js";
import { newManualComplaintAgreement } from "./manual-complaint-agreement.js";

test("MemoryManualComplaintAgreementStore finds what it saved", () => {
  const store = newMemoryManualComplaintAgreementStore();
  const item = newManualComplaintAgreement("code-148", "title-704");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
