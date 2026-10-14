import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryOptOutWindowStore } from "./opt-out-window-store.js";
import { newOptOutWindow } from "./opt-out-window.js";

test("MemoryOptOutWindowStore finds what it saved", () => {
  const store = newMemoryOptOutWindowStore();
  const item = newOptOutWindow("code-579", "title-650");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
