import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightTierStore } from "./flight-tier-store.js";
import { newFlightTier } from "./flight-tier.js";

test("MemoryFlightTierStore finds what it saved", () => {
  const store = newMemoryFlightTierStore();
  const item = newFlightTier("code-953", "name-295");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
