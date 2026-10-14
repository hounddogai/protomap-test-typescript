import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallEntryStore } from "./paywall-entry-store.js";
import { newPaywallEntry } from "./paywall-entry.js";

test("MemoryPaywallEntryStore finds what it saved", () => {
  const store = newMemoryPaywallEntryStore();
  const item = newPaywallEntry("code-838", "name-593");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
