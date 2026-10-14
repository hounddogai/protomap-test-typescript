import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyEstimateStore } from "./frequency-estimate-store.js";
import { newFrequencyEstimate } from "./frequency-estimate.js";

test("MemoryFrequencyEstimateStore finds what it saved", () => {
  const store = newMemoryFrequencyEstimateStore();
  const item = newFrequencyEstimate("code-998", "label-730");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
