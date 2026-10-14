import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderEntryStore } from "./sender-entry-store.js";
import { newSenderEntry } from "./sender-entry.js";

test("MemorySenderEntryStore finds what it saved", () => {
  const store = newMemorySenderEntryStore();
  const item = newSenderEntry("code-731", "label-500");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
