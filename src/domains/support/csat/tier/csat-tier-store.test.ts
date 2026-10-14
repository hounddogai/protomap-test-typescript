import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatTierStore } from "./csat-tier-store.js";
import { newCsatTier } from "./csat-tier.js";

test("MemoryCsatTierStore finds what it saved", () => {
  const store = newMemoryCsatTierStore();
  const item = newCsatTier("code-759", "title-401");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
