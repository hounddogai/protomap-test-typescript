import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledRetentionWindowStore } from "./scheduled-retention-window-store.js";
import { newScheduledRetentionWindow } from "./scheduled-retention-window.js";

test("MemoryScheduledRetentionWindowStore finds what it saved", () => {
  const store = newMemoryScheduledRetentionWindowStore();
  const item = newScheduledRetentionWindow("code-26", "name-733");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
