import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionClaimStore } from "./suppression-claim-store.js";
import { newSuppressionClaim } from "./suppression-claim.js";

test("MemorySuppressionClaimStore finds what it saved", () => {
  const store = newMemorySuppressionClaimStore();
  const item = newSuppressionClaim("code-949", "label-317");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
