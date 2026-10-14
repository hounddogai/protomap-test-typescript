import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathVarianceStore } from "./path-variance-store.js";
import { newPathVariance } from "./path-variance.js";

test("MemoryPathVarianceStore finds what it saved", () => {
  const store = newMemoryPathVarianceStore();
  const item = newPathVariance("code-558", "name-134");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
