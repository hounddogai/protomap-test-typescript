import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitEstimateStore } from "./wait-estimate-store.js";
import { newWaitEstimate } from "./wait-estimate.js";

test("MemoryWaitEstimateStore finds what it saved", () => {
  const store = newMemoryWaitEstimateStore();
  const item = newWaitEstimate("code-949", "name-886");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
