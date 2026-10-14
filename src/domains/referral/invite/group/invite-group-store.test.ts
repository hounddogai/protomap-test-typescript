import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteGroupStore } from "./invite-group-store.js";
import { newInviteGroup } from "./invite-group.js";

test("MemoryInviteGroupStore finds what it saved", () => {
  const store = newMemoryInviteGroupStore();
  const item = newInviteGroup("code-879", "name-103");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
