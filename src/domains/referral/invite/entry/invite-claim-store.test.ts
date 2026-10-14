import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteClaimStore } from "./invite-claim-store.js";
import { newInviteClaim } from "./invite-claim.js";

test("MemoryInviteClaimStore finds what it saved", () => {
  const store = newMemoryInviteClaimStore();
  const item = newInviteClaim("code-674", "name-168");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
