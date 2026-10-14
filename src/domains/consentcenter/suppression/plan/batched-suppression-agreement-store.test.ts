import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedSuppressionAgreementStore } from "./batched-suppression-agreement-store.js";
import { newBatchedSuppressionAgreement } from "./batched-suppression-agreement.js";

test("MemoryBatchedSuppressionAgreementStore finds what it saved", () => {
  const store = newMemoryBatchedSuppressionAgreementStore();
  const item = newBatchedSuppressionAgreement("code-203", "name-864");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
