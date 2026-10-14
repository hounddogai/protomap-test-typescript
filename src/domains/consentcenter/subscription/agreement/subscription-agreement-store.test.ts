import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionAgreementStore } from "./subscription-agreement-store.js";
import { newSubscriptionAgreement } from "./subscription-agreement.js";

test("MemorySubscriptionAgreementStore finds what it saved", () => {
  const store = newMemorySubscriptionAgreementStore();
  const item = newSubscriptionAgreement("code-478", "title-633");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
