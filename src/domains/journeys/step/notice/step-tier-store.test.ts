import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepTierStore } from "./step-tier-store.js";
import { newStepTier } from "./step-tier.js";

test("MemoryStepTierStore finds what it saved", () => {
  const store = newMemoryStepTierStore();
  const item = newStepTier("code-626", "title-909");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
