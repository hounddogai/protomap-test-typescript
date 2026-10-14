import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledSenderEntryStore } from "./scheduled-sender-entry-store.js";
import { newScheduledSenderEntry } from "./scheduled-sender-entry.js";

test("MemoryScheduledSenderEntryStore finds what it saved", () => {
  const store = newMemoryScheduledSenderEntryStore();
  const item = newScheduledSenderEntry("code-969", "title-457");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
