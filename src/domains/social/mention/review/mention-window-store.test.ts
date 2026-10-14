import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionWindowStore } from "./mention-window-store.js";
import { newMentionWindow } from "./mention-window.js";

test("MemoryMentionWindowStore finds what it saved", () => {
  const store = newMemoryMentionWindowStore();
  const item = newMentionWindow("code-420", "name-474");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
