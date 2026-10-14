import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightEstimateStore } from "./insight-estimate-store.js";
import { newInsightEstimate } from "./insight-estimate.js";

test("MemoryInsightEstimateStore finds what it saved", () => {
  const store = newMemoryInsightEstimateStore();
  const item = newInsightEstimate("code-656", "label-450");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
