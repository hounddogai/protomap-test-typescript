import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledWarmupClaimStore } from "./scheduled-warmup-claim-store.js";
import { newScheduledWarmupClaim } from "./scheduled-warmup-claim.js";

test("MemoryScheduledWarmupClaimStore finds what it saved", () => {
  const store = newMemoryScheduledWarmupClaimStore();
  const item = newScheduledWarmupClaim("code-982", "label-314");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
