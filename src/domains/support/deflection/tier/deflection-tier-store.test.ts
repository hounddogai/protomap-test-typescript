import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionTierStore } from "./deflection-tier-store.js";
import { newDeflectionTier } from "./deflection-tier.js";

test("MemoryDeflectionTierStore finds what it saved", () => {
  const store = newMemoryDeflectionTierStore();
  const item = newDeflectionTier("code-534", "title-395");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
