import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultSuppressionEstimateStore } from "./default-suppression-estimate-store.js";
import { newDefaultSuppressionEstimate } from "./default-suppression-estimate.js";

test("MemoryDefaultSuppressionEstimateStore finds what it saved", () => {
  const store = newMemoryDefaultSuppressionEstimateStore();
  const item = newDefaultSuppressionEstimate("code-965", "title-793");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
