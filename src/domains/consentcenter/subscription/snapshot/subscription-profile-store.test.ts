import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionProfileStore } from "./subscription-profile-store.js";
import { newSubscriptionProfile } from "./subscription-profile.js";

test("MemorySubscriptionProfileStore finds what it saved", () => {
  const store = newMemorySubscriptionProfileStore();
  const item = newSubscriptionProfile("code-429", "name-596");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
