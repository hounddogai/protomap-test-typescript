import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryQueueAgreementStore } from "./queue-agreement-store.js";
import { newQueueAgreement } from "./queue-agreement.js";

test("MemoryQueueAgreementStore finds what it saved", () => {
  const store = newMemoryQueueAgreementStore();
  const item = newQueueAgreement("code-225", "label-169");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
