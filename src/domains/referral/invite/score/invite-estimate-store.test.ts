import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteEstimateStore } from "./invite-estimate-store.js";
import { newInviteEstimate } from "./invite-estimate.js";

test("MemoryInviteEstimateStore finds what it saved", () => {
  const store = newMemoryInviteEstimateStore();
  const item = newInviteEstimate("code-914", "label-343");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
