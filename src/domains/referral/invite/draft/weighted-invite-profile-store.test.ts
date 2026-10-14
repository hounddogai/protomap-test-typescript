import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedInviteProfileStore } from "./weighted-invite-profile-store.js";
import { newWeightedInviteProfile } from "./weighted-invite-profile.js";

test("MemoryWeightedInviteProfileStore finds what it saved", () => {
  const store = newMemoryWeightedInviteProfileStore();
  const item = newWeightedInviteProfile("code-682", "label-23");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
