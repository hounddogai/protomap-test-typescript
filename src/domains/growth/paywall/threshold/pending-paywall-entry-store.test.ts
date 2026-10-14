import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingPaywallEntryStore } from "./pending-paywall-entry-store.js";
import { newPendingPaywallEntry } from "./pending-paywall-entry.js";

test("MemoryPendingPaywallEntryStore finds what it saved", () => {
  const store = newMemoryPendingPaywallEntryStore();
  const item = newPendingPaywallEntry("code-101", "name-868");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
