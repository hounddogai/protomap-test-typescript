import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionEstimateStore } from "./subscription-estimate-store.js";
import { newSubscriptionEstimate } from "./subscription-estimate.js";

test("MemorySubscriptionEstimateStore finds what it saved", () => {
  const store = newMemorySubscriptionEstimateStore();
  const item = newSubscriptionEstimate("code-560", "name-164");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
