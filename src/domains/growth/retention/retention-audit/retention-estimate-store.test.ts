import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionEstimateStore } from "./retention-estimate-store.js";
import { newRetentionEstimate } from "./retention-estimate.js";

test("MemoryRetentionEstimateStore finds what it saved", () => {
  const store = newMemoryRetentionEstimateStore();
  const item = newRetentionEstimate("code-348", "label-907");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
