import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientSuppressionAgreementStore } from "./lenient-suppression-agreement-store.js";
import { newLenientSuppressionAgreement } from "./lenient-suppression-agreement.js";

test("MemoryLenientSuppressionAgreementStore finds what it saved", () => {
  const store = newMemoryLenientSuppressionAgreementStore();
  const item = newLenientSuppressionAgreement("code-564", "label-370");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
