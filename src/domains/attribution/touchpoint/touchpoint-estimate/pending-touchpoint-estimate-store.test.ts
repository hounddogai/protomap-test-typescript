import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingTouchpointEstimateStore } from "./pending-touchpoint-estimate-store.js";
import { newPendingTouchpointEstimate } from "./pending-touchpoint-estimate.js";

test("MemoryPendingTouchpointEstimateStore finds what it saved", () => {
  const store = newMemoryPendingTouchpointEstimateStore();
  const item = newPendingTouchpointEstimate("code-622", "name-32");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
