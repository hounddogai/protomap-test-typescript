import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveComplaintAgreementStore } from "./adaptive-complaint-agreement-store.js";
import { newAdaptiveComplaintAgreement } from "./adaptive-complaint-agreement.js";

test("MemoryAdaptiveComplaintAgreementStore finds what it saved", () => {
  const store = newMemoryAdaptiveComplaintAgreementStore();
  const item = newAdaptiveComplaintAgreement("code-679", "label-724");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
