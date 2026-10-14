import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryInviteEstimateStore } from "./primary-invite-estimate-store.js";
import { newPrimaryInviteEstimate } from "./primary-invite-estimate.js";

test("MemoryPrimaryInviteEstimateStore finds what it saved", () => {
  const store = newMemoryPrimaryInviteEstimateStore();
  const item = newPrimaryInviteEstimate("code-989", "name-16");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
