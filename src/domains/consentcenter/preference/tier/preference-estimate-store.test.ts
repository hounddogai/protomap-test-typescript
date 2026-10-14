import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceEstimateStore } from "./preference-estimate-store.js";
import { newPreferenceEstimate } from "./preference-estimate.js";

test("MemoryPreferenceEstimateStore finds what it saved", () => {
  const store = newMemoryPreferenceEstimateStore();
  const item = newPreferenceEstimate("code-353", "title-863");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
