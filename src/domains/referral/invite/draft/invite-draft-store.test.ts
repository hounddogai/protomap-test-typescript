import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteDraftStore } from "./invite-draft-store.js";
import { newInviteDraft } from "./invite-draft.js";

test("MemoryInviteDraftStore finds what it saved", () => {
  const store = newMemoryInviteDraftStore();
  const item = newInviteDraft("code-165", "name-623");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
