import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPaywallWindowStore } from "./rolling-paywall-window-store.js";
import { newRollingPaywallWindow } from "./rolling-paywall-window.js";

test("MemoryRollingPaywallWindowStore finds what it saved", () => {
  const store = newMemoryRollingPaywallWindowStore();
  const item = newRollingPaywallWindow("code-539", "label-806");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
