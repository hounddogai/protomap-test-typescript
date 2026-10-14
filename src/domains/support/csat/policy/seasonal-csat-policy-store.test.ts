import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCsatPolicyStore } from "./seasonal-csat-policy-store.js";
import { newSeasonalCsatPolicy } from "./seasonal-csat-policy.js";

test("MemorySeasonalCsatPolicyStore finds what it saved", () => {
  const store = newMemorySeasonalCsatPolicyStore();
  const item = newSeasonalCsatPolicy("code-40", "name-347");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
