import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingProofTierStore } from "./rolling-proof-tier-store.js";
import { newRollingProofTier } from "./rolling-proof-tier.js";

test("MemoryRollingProofTierStore finds what it saved", () => {
  const store = newMemoryRollingProofTierStore();
  const item = newRollingProofTier("code-324", "title-247");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
