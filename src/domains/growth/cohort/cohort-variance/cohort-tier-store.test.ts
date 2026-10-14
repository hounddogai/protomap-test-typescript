import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortTierStore } from "./cohort-tier-store.js";
import { newCohortTier } from "./cohort-tier.js";

test("MemoryCohortTierStore finds what it saved", () => {
  const store = newMemoryCohortTierStore();
  const item = newCohortTier("code-568", "label-416");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
