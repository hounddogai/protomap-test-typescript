import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackBounceRollupStore } from "./fallback-bounce-rollup-store.js";
import { newFallbackBounceRollup } from "./fallback-bounce-rollup.js";

test("MemoryFallbackBounceRollupStore finds what it saved", () => {
  const store = newMemoryFallbackBounceRollupStore();
  const item = newFallbackBounceRollup("code-281", "name-998");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
