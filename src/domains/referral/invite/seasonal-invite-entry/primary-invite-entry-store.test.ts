import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryInviteEntryStore } from "./primary-invite-entry-store.js";
import { newPrimaryInviteEntry } from "./primary-invite-entry.js";

test("MemoryPrimaryInviteEntryStore finds what it saved", () => {
  const store = newMemoryPrimaryInviteEntryStore();
  const item = newPrimaryInviteEntry("code-59", "title-421");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
