import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitWindowStore } from "./wait-window-store.js";
import { newWaitWindow } from "./wait-window.js";

test("MemoryWaitWindowStore finds what it saved", () => {
  const store = newMemoryWaitWindowStore();
  const item = newWaitWindow("code-73", "label-147");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
