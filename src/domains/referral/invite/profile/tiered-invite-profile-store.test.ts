import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredInviteProfileStore } from "./tiered-invite-profile-store.js";
import { newTieredInviteProfile } from "./tiered-invite-profile.js";

test("MemoryTieredInviteProfileStore finds what it saved", () => {
  const store = newMemoryTieredInviteProfileStore();
  const item = newTieredInviteProfile("code-274", "title-21");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
