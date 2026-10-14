import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictQueueVarianceStore } from "./strict-queue-variance-store.js";
import { newStrictQueueVariance } from "./strict-queue-variance.js";

test("MemoryStrictQueueVarianceStore finds what it saved", () => {
  const store = newMemoryStrictQueueVarianceStore();
  const item = newStrictQueueVariance("code-902", "name-372");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
