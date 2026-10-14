import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacySuppressionClaimStore } from "./legacy-suppression-claim-store.js";
import { newLegacySuppressionClaim } from "./legacy-suppression-claim.js";

test("MemoryLegacySuppressionClaimStore finds what it saved", () => {
  const store = newMemoryLegacySuppressionClaimStore();
  const item = newLegacySuppressionClaim("code-840", "name-829");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
