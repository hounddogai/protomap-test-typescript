import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackCreativeWindowStore } from "./fallback-creative-window-store.js";
import { newFallbackCreativeWindow } from "./fallback-creative-window.js";

test("MemoryFallbackCreativeWindowStore finds what it saved", () => {
  const store = newMemoryFallbackCreativeWindowStore();
  const item = newFallbackCreativeWindow("code-561", "label-880");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
