import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPaywallWindowStore } from "./regional-paywall-window-store.js";
import { newRegionalPaywallWindow } from "./regional-paywall-window.js";

test("MemoryRegionalPaywallWindowStore finds what it saved", () => {
  const store = newMemoryRegionalPaywallWindowStore();
  const item = newRegionalPaywallWindow("code-101", "title-314");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
