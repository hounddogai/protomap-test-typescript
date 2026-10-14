import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBounceOverrideStore } from "./tiered-bounce-override-store.js";
import { newTieredBounceOverride } from "./tiered-bounce-override.js";

test("MemoryTieredBounceOverrideStore finds what it saved", () => {
  const store = newMemoryTieredBounceOverrideStore();
  const item = newTieredBounceOverride("code-190", "name-383");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
