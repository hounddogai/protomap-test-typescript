import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingWaitWindowStore } from "./rolling-wait-window-store.js";
import { newRollingWaitWindow } from "./rolling-wait-window.js";

test("MemoryRollingWaitWindowStore finds what it saved", () => {
  const store = newMemoryRollingWaitWindowStore();
  const item = newRollingWaitWindow("code-942", "label-765");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
