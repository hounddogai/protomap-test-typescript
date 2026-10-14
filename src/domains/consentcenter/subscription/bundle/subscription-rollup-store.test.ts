import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionRollupStore } from "./subscription-rollup-store.js";
import { newSubscriptionRollup } from "./subscription-rollup.js";

test("MemorySubscriptionRollupStore finds what it saved", () => {
  const store = newMemorySubscriptionRollupStore();
  const item = newSubscriptionRollup("code-252", "name-940");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
