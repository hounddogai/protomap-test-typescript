import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackStreakTargetStore } from "./fallback-streak-target-store.js";
import { newFallbackStreakTarget } from "./fallback-streak-target.js";

test("MemoryFallbackStreakTargetStore finds what it saved", () => {
  const store = newMemoryFallbackStreakTargetStore();
  const item = newFallbackStreakTarget("code-237", "name-269");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
