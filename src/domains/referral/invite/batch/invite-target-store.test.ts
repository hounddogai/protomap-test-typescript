import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteTargetStore } from "./invite-target-store.js";
import { newInviteTarget } from "./invite-target.js";

test("MemoryInviteTargetStore finds what it saved", () => {
  const store = newMemoryInviteTargetStore();
  const item = newInviteTarget("code-290", "label-183");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
