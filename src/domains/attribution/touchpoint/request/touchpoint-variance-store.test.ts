import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointVarianceStore } from "./touchpoint-variance-store.js";
import { newTouchpointVariance } from "./touchpoint-variance.js";

test("MemoryTouchpointVarianceStore finds what it saved", () => {
  const store = newMemoryTouchpointVarianceStore();
  const item = newTouchpointVariance("code-635", "label-630");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
