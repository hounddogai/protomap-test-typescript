import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeWindowStore } from "./creative-window-store.js";
import { newCreativeWindow } from "./creative-window.js";

test("MemoryCreativeWindowStore finds what it saved", () => {
  const store = newMemoryCreativeWindowStore();
  const item = newCreativeWindow("code-276", "title-133");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
