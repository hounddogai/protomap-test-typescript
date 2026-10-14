import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredActivationWindowStore } from "./tiered-activation-window-store.js";
import { newTieredActivationWindow } from "./tiered-activation-window.js";

test("MemoryTieredActivationWindowStore finds what it saved", () => {
  const store = newMemoryTieredActivationWindowStore();
  const item = newTieredActivationWindow("code-362", "title-155");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
