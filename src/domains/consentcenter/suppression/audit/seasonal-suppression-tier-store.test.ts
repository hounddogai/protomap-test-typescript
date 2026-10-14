import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalSuppressionTierStore } from "./seasonal-suppression-tier-store.js";
import { newSeasonalSuppressionTier } from "./seasonal-suppression-tier.js";

test("MemorySeasonalSuppressionTierStore finds what it saved", () => {
  const store = newMemorySeasonalSuppressionTierStore();
  const item = newSeasonalSuppressionTier("code-356", "title-903");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
