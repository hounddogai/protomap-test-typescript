import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationEstimateStore } from "./reputation-estimate-store.js";
import { newReputationEstimate } from "./reputation-estimate.js";

test("MemoryReputationEstimateStore finds what it saved", () => {
  const store = newMemoryReputationEstimateStore();
  const item = newReputationEstimate("code-60", "title-283");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
