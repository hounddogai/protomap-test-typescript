import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakBaselineStore } from "./streak-baseline-store.js";
import { newStreakBaseline } from "./streak-baseline.js";

test("MemoryStreakBaselineStore finds what it saved", () => {
  const store = newMemoryStreakBaselineStore();
  const item = newStreakBaseline("code-507", "name-12");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
