import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelEstimateStore } from "./level-estimate-store.js";
import { newLevelEstimate } from "./level-estimate.js";

test("MemoryLevelEstimateStore finds what it saved", () => {
  const store = newMemoryLevelEstimateStore();
  const item = newLevelEstimate("code-39", "name-456");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
