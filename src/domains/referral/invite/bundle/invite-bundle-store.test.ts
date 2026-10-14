import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteBundleStore } from "./invite-bundle-store.js";
import { newInviteBundle } from "./invite-bundle.js";

test("MemoryInviteBundleStore finds what it saved", () => {
  const store = newMemoryInviteBundleStore();
  const item = newInviteBundle("code-964", "label-517");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
