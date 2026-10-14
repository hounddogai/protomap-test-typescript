import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatEstimateStore } from "./csat-estimate-store.js";
import { newCsatEstimate } from "./csat-estimate.js";

test("MemoryCsatEstimateStore finds what it saved", () => {
  const store = newMemoryCsatEstimateStore();
  const item = newCsatEstimate("code-100", "label-995");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
