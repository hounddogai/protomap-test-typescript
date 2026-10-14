import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingTouchpointWindowStore } from "./pending-touchpoint-window-store.js";
import { newPendingTouchpointWindow } from "./pending-touchpoint-window.js";

test("MemoryPendingTouchpointWindowStore finds what it saved", () => {
  const store = newMemoryPendingTouchpointWindowStore();
  const item = newPendingTouchpointWindow("code-594", "title-384");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
