import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPostWindowStore } from "./lenient-post-window-store.js";
import { newLenientPostWindow } from "./lenient-post-window.js";

test("MemoryLenientPostWindowStore finds what it saved", () => {
  const store = newMemoryLenientPostWindowStore();
  const item = newLenientPostWindow("code-386", "label-521");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
