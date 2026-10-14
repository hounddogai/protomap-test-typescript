import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalStreakPolicyStore } from "./seasonal-streak-policy-store.js";
import { newSeasonalStreakPolicy } from "./seasonal-streak-policy.js";

test("MemorySeasonalStreakPolicyStore finds what it saved", () => {
  const store = newMemorySeasonalStreakPolicyStore();
  const item = newSeasonalStreakPolicy("code-602", "name-383");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
