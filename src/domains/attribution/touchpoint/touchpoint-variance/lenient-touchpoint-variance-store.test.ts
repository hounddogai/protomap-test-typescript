import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientTouchpointVarianceStore } from "./lenient-touchpoint-variance-store.js";
import { newLenientTouchpointVariance } from "./lenient-touchpoint-variance.js";

test("MemoryLenientTouchpointVarianceStore finds what it saved", () => {
  const store = newMemoryLenientTouchpointVarianceStore();
  const item = newLenientTouchpointVariance("code-797", "name-264");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
