import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteProfileStore } from "./invite-profile-store.js";
import { newInviteProfile } from "./invite-profile.js";

test("MemoryInviteProfileStore finds what it saved", () => {
  const store = newMemoryInviteProfileStore();
  const item = newInviteProfile("code-63", "title-666");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
