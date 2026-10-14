import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointEstimateStore } from "./touchpoint-estimate-store.js";
import { newTouchpointEstimate } from "./touchpoint-estimate.js";

test("MemoryTouchpointEstimateStore finds what it saved", () => {
  const store = newMemoryTouchpointEstimateStore();
  const item = newTouchpointEstimate("code-72", "label-682");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
