import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledWindowTierStore } from "./scheduled-window-tier-store.js";
import { newScheduledWindowTier } from "./scheduled-window-tier.js";

test("MemoryScheduledWindowTierStore finds what it saved", () => {
  const store = newMemoryScheduledWindowTierStore();
  const item = newScheduledWindowTier("code-686", "title-85");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
