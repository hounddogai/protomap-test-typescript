import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedInviteTierStore } from "./weighted-invite-tier-store.js";
import { newWeightedInviteTier } from "./weighted-invite-tier.js";

test("MemoryWeightedInviteTierStore finds what it saved", () => {
  const store = newMemoryWeightedInviteTierStore();
  const item = newWeightedInviteTier("code-19", "name-27");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
