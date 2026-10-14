import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedPaywallEntryStore } from "./batched-paywall-entry-store.js";
import { newBatchedPaywallEntry } from "./batched-paywall-entry.js";

test("MemoryBatchedPaywallEntryStore finds what it saved", () => {
  const store = newMemoryBatchedPaywallEntryStore();
  const item = newBatchedPaywallEntry("code-708", "name-15");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
