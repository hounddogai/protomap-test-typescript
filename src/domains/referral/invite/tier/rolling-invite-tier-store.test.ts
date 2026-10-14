import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingInviteTierStore } from "./rolling-invite-tier-store.js";
import { newRollingInviteTier } from "./rolling-invite-tier.js";

test("MemoryRollingInviteTierStore finds what it saved", () => {
  const store = newMemoryRollingInviteTierStore();
  const item = newRollingInviteTier("code-540", "name-86");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
