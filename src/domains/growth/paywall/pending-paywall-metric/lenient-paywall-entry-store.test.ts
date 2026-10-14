import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPaywallEntryStore } from "./lenient-paywall-entry-store.js";
import { newLenientPaywallEntry } from "./lenient-paywall-entry.js";

test("MemoryLenientPaywallEntryStore finds what it saved", () => {
  const store = newMemoryLenientPaywallEntryStore();
  const item = newLenientPaywallEntry("code-433", "title-18");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
