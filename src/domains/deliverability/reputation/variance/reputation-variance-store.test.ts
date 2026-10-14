import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationVarianceStore } from "./reputation-variance-store.js";
import { newReputationVariance } from "./reputation-variance.js";

test("MemoryReputationVarianceStore finds what it saved", () => {
  const store = newMemoryReputationVarianceStore();
  const item = newReputationVariance("code-326", "name-219");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
