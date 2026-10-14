import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointWindowStore } from "./touchpoint-window-store.js";
import { newTouchpointWindow } from "./touchpoint-window.js";

test("MemoryTouchpointWindowStore finds what it saved", () => {
  const store = newMemoryTouchpointWindowStore();
  const item = newTouchpointWindow("code-988", "name-857");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
