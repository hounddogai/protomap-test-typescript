import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteTierStore } from "./invite-tier-store.js";
import { newInviteTier } from "./invite-tier.js";

test("MemoryInviteTierStore finds what it saved", () => {
  const store = newMemoryInviteTierStore();
  const item = newInviteTier("code-82", "title-735");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
