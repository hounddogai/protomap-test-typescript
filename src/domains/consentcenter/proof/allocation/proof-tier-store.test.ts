import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofTierStore } from "./proof-tier-store.js";
import { newProofTier } from "./proof-tier.js";

test("MemoryProofTierStore finds what it saved", () => {
  const store = newMemoryProofTierStore();
  const item = newProofTier("code-812", "title-82");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
