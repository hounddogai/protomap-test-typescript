import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingSubscriptionSummaryStore } from "./rolling-subscription-summary-store.js";
import { newRollingSubscriptionSummary } from "./rolling-subscription-summary.js";

test("MemoryRollingSubscriptionSummaryStore finds what it saved", () => {
  const store = newMemoryRollingSubscriptionSummaryStore();
  const item = newRollingSubscriptionSummary("code-994", "name-393");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
