import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupClaimStore } from "./warmup-claim-store.js";
import { newWarmupClaim } from "./warmup-claim.js";

test("MemoryWarmupClaimStore finds what it saved", () => {
  const store = newMemoryWarmupClaimStore();
  const item = newWarmupClaim("code-573", "title-983");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
