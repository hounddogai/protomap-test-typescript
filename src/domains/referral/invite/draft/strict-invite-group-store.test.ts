import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictInviteGroupStore } from "./strict-invite-group-store.js";
import { newStrictInviteGroup } from "./strict-invite-group.js";

test("MemoryStrictInviteGroupStore finds what it saved", () => {
  const store = newMemoryStrictInviteGroupStore();
  const item = newStrictInviteGroup("code-59", "name-672");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
