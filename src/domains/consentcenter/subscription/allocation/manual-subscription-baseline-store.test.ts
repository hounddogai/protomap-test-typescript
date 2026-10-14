import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualSubscriptionBaselineStore } from "./manual-subscription-baseline-store.js";
import { newManualSubscriptionBaseline } from "./manual-subscription-baseline.js";

test("MemoryManualSubscriptionBaselineStore finds what it saved", () => {
  const store = newMemoryManualSubscriptionBaselineStore();
  const item = newManualSubscriptionBaseline("code-798", "name-699");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
