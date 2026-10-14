import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyTierStore } from "./frequency-tier-store.js";
import { newFrequencyTier } from "./frequency-tier.js";

test("MemoryFrequencyTierStore finds what it saved", () => {
  const store = newMemoryFrequencyTierStore();
  const item = newFrequencyTier("code-333", "label-73");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
