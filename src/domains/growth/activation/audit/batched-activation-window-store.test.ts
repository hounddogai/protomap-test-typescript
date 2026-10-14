import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedActivationWindowStore } from "./batched-activation-window-store.js";
import { newBatchedActivationWindow } from "./batched-activation-window.js";

test("MemoryBatchedActivationWindowStore finds what it saved", () => {
  const store = newMemoryBatchedActivationWindowStore();
  const item = newBatchedActivationWindow("code-597", "label-315");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
