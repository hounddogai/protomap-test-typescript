import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceVarianceStore } from "./bounce-variance-store.js";
import { newBounceVariance } from "./bounce-variance.js";

test("MemoryBounceVarianceStore finds what it saved", () => {
  const store = newMemoryBounceVarianceStore();
  const item = newBounceVariance("code-189", "name-617");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
