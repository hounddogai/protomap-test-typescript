import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalFlightTierStore } from "./global-flight-tier-store.js";
import { newGlobalFlightTier } from "./global-flight-tier.js";

test("MemoryGlobalFlightTierStore finds what it saved", () => {
  const store = newMemoryGlobalFlightTierStore();
  const item = newGlobalFlightTier("code-843", "name-387");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
