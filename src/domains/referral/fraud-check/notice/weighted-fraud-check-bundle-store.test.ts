import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedFraudCheckBundleStore } from "./weighted-fraud-check-bundle-store.js";
import { newWeightedFraudCheckBundle } from "./weighted-fraud-check-bundle.js";

test("MemoryWeightedFraudCheckBundleStore finds what it saved", () => {
  const store = newMemoryWeightedFraudCheckBundleStore();
  const item = newWeightedFraudCheckBundle("code-971", "label-713");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
