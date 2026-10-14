import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyTierStore } from "./journey-tier-store.js";
import { newJourneyTier } from "./journey-tier.js";

test("MemoryJourneyTierStore finds what it saved", () => {
  const store = newMemoryJourneyTierStore();
  const item = newJourneyTier("code-94", "name-140");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
