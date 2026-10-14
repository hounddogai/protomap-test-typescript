import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedQueueAgreementStore } from "./batched-queue-agreement-store.js";
import { newBatchedQueueAgreement } from "./batched-queue-agreement.js";

test("MemoryBatchedQueueAgreementStore finds what it saved", () => {
  const store = newMemoryBatchedQueueAgreementStore();
  const item = newBatchedQueueAgreement("code-666", "name-478");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
