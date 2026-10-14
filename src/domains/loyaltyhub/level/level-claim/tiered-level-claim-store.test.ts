import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredLevelClaimStore } from "./tiered-level-claim-store.js";
import { newTieredLevelClaim } from "./tiered-level-claim.js";

test("MemoryTieredLevelClaimStore finds what it saved", () => {
  const store = newMemoryTieredLevelClaimStore();
  const item = newTieredLevelClaim("code-42", "title-30");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
