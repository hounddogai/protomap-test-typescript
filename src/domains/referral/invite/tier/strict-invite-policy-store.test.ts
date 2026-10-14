import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictInvitePolicyStore } from "./strict-invite-policy-store.js";
import { newStrictInvitePolicy } from "./strict-invite-policy.js";

test("MemoryStrictInvitePolicyStore finds what it saved", () => {
  const store = newMemoryStrictInvitePolicyStore();
  const item = newStrictInvitePolicy("code-713", "title-412");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
