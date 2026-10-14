import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakVarianceStore } from "./streak-variance-store.js";
import { newStreakVariance } from "./streak-variance.js";

test("MemoryStreakVarianceStore finds what it saved", () => {
  const store = newMemoryStreakVarianceStore();
  const item = newStreakVariance("code-284", "label-721");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
