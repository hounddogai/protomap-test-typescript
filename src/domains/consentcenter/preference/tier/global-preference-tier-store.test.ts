import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalPreferenceTierStore } from "./global-preference-tier-store.js";
import { newGlobalPreferenceTier } from "./global-preference-tier.js";

test("MemoryGlobalPreferenceTierStore finds what it saved", () => {
  const store = newMemoryGlobalPreferenceTierStore();
  const item = newGlobalPreferenceTier("code-309", "title-619");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
