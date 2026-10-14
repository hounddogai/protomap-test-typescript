import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySubscriptionRequestStore } from "./primary-subscription-request-store.js";
import { newPrimarySubscriptionRequest } from "./primary-subscription-request.js";

test("MemoryPrimarySubscriptionRequestStore finds what it saved", () => {
  const store = newMemoryPrimarySubscriptionRequestStore();
  const item = newPrimarySubscriptionRequest("code-85", "name-910");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
