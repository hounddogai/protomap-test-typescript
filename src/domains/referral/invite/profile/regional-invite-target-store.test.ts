import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalInviteTargetStore } from "./regional-invite-target-store.js";
import { newRegionalInviteTarget } from "./regional-invite-target.js";

test("MemoryRegionalInviteTargetStore finds what it saved", () => {
  const store = newMemoryRegionalInviteTargetStore();
  const item = newRegionalInviteTarget("code-136", "label-781");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
