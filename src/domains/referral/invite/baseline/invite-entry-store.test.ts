import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteEntryStore } from "./invite-entry-store.js";
import { newInviteEntry } from "./invite-entry.js";

test("MemoryInviteEntryStore finds what it saved", () => {
  const store = newMemoryInviteEntryStore();
  const item = newInviteEntry("code-796", "title-357");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
