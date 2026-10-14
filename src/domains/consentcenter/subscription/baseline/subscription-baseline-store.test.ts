import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionBaselineStore } from "./subscription-baseline-store.js";
import { newSubscriptionBaseline } from "./subscription-baseline.js";

test("MemorySubscriptionBaselineStore finds what it saved", () => {
  const store = newMemorySubscriptionBaselineStore();
  const item = newSubscriptionBaseline("code-971", "label-358");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
