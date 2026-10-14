import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelEstimateStore } from "./model-estimate-store.js";
import { newModelEstimate } from "./model-estimate.js";

test("MemoryModelEstimateStore finds what it saved", () => {
  const store = newMemoryModelEstimateStore();
  const item = newModelEstimate("code-648", "title-91");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
