import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroTierStore } from "./macro-tier-store.js";
import { newMacroTier } from "./macro-tier.js";

test("MemoryMacroTierStore finds what it saved", () => {
  const store = newMemoryMacroTierStore();
  const item = newMacroTier("code-187", "title-351");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
