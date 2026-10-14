import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionGroupStore } from "./subscription-group-store.js";
import { newSubscriptionGroup } from "./subscription-group.js";

test("MemorySubscriptionGroupStore finds what it saved", () => {
  const store = newMemorySubscriptionGroupStore();
  const item = newSubscriptionGroup("code-196", "title-471");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
