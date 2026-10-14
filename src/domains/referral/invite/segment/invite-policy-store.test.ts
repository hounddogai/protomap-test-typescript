import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInvitePolicyStore } from "./invite-policy-store.js";
import { newInvitePolicy } from "./invite-policy.js";

test("MemoryInvitePolicyStore finds what it saved", () => {
  const store = newMemoryInvitePolicyStore();
  const item = newInvitePolicy("code-881", "title-973");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
