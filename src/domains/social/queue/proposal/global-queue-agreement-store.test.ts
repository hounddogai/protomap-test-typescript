import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalQueueAgreementStore } from "./global-queue-agreement-store.js";
import { newGlobalQueueAgreement } from "./global-queue-agreement.js";

test("MemoryGlobalQueueAgreementStore finds what it saved", () => {
  const store = newMemoryGlobalQueueAgreementStore();
  const item = newGlobalQueueAgreement("code-774", "label-453");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
