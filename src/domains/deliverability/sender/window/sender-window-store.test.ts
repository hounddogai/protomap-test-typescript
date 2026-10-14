import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderWindowStore } from "./sender-window-store.js";
import { newSenderWindow } from "./sender-window.js";

test("MemorySenderWindowStore finds what it saved", () => {
  const store = newMemorySenderWindowStore();
  const item = newSenderWindow("code-690", "title-785");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
