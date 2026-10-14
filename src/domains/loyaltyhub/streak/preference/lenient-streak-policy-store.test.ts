import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientStreakPolicyStore } from "./lenient-streak-policy-store.js";
import { newLenientStreakPolicy } from "./lenient-streak-policy.js";

test("MemoryLenientStreakPolicyStore finds what it saved", () => {
  const store = newMemoryLenientStreakPolicyStore();
  const item = newLenientStreakPolicy("code-668", "title-527");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
