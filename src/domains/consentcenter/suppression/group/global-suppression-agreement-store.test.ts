import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalSuppressionAgreementStore } from "./global-suppression-agreement-store.js";
import { newGlobalSuppressionAgreement } from "./global-suppression-agreement.js";

test("MemoryGlobalSuppressionAgreementStore finds what it saved", () => {
  const store = newMemoryGlobalSuppressionAgreementStore();
  const item = newGlobalSuppressionAgreement("code-406", "name-605");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
