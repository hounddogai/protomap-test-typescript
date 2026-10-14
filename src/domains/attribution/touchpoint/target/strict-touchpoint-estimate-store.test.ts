import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictTouchpointEstimateStore } from "./strict-touchpoint-estimate-store.js";
import { newStrictTouchpointEstimate } from "./strict-touchpoint-estimate.js";

test("MemoryStrictTouchpointEstimateStore finds what it saved", () => {
  const store = newMemoryStrictTouchpointEstimateStore();
  const item = newStrictTouchpointEstimate("code-939", "label-852");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
