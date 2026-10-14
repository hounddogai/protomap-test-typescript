import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyEntryStore } from "./reply-entry-store.js";
import { newReplyEntry } from "./reply-entry.js";

test("MemoryReplyEntryStore finds what it saved", () => {
  const store = newMemoryReplyEntryStore();
  const item = newReplyEntry("code-512", "label-871");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
