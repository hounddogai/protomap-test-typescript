import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualConversionTierStore } from "./manual-conversion-tier-store.js";
import { newManualConversionTier } from "./manual-conversion-tier.js";

test("MemoryManualConversionTierStore finds what it saved", () => {
  const store = newMemoryManualConversionTierStore();
  const item = newManualConversionTier("code-20", "name-883");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
