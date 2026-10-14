import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingSenderClaimStore } from "./rolling-sender-claim-store.js";
import { newRollingSenderClaim } from "./rolling-sender-claim.js";

test("MemoryRollingSenderClaimStore finds what it saved", () => {
  const store = newMemoryRollingSenderClaimStore();
  const item = newRollingSenderClaim("code-546", "title-924");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
