import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelTierStore } from "./model-tier-store.js";
import { newModelTier } from "./model-tier.js";

test("MemoryModelTierStore finds what it saved", () => {
  const store = newMemoryModelTierStore();
  const item = newModelTier("code-602", "name-225");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
