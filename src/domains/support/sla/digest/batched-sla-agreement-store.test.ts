import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedSlaAgreementStore } from "./batched-sla-agreement-store.js";
import { newBatchedSlaAgreement } from "./batched-sla-agreement.js";

test("MemoryBatchedSlaAgreementStore finds what it saved", () => {
  const store = newMemoryBatchedSlaAgreementStore();
  const item = newBatchedSlaAgreement("code-133", "label-36");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
