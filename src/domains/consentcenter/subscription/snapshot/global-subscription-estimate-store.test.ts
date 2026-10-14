import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalSubscriptionEstimateStore } from "./global-subscription-estimate-store.js";
import { newGlobalSubscriptionEstimate } from "./global-subscription-estimate.js";

test("MemoryGlobalSubscriptionEstimateStore finds what it saved", () => {
  const store = newMemoryGlobalSubscriptionEstimateStore();
  const item = newGlobalSubscriptionEstimate("code-486", "name-63");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
