import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionEntryStore } from "./mention-entry-store.js";
import { newMentionEntry } from "./mention-entry.js";

test("MemoryMentionEntryStore finds what it saved", () => {
  const store = newMemoryMentionEntryStore();
  const item = newMentionEntry("code-530", "title-318");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
