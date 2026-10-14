import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultModelTierStore } from "./default-model-tier-store.js";
import { newDefaultModelTier } from "./default-model-tier.js";

test("MemoryDefaultModelTierStore finds what it saved", () => {
  const store = newMemoryDefaultModelTierStore();
  const item = newDefaultModelTier("code-948", "label-249");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
