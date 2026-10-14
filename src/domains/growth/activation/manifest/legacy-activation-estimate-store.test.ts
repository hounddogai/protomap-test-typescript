import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyActivationEstimateStore } from "./legacy-activation-estimate-store.js";
import { newLegacyActivationEstimate } from "./legacy-activation-estimate.js";

test("MemoryLegacyActivationEstimateStore finds what it saved", () => {
  const store = newMemoryLegacyActivationEstimateStore();
  const item = newLegacyActivationEstimate("code-445", "label-348");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
