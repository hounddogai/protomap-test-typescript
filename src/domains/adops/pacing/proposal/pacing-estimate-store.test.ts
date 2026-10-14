import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingEstimateStore } from "./pacing-estimate-store.js";
import { newPacingEstimate } from "./pacing-estimate.js";

test("MemoryPacingEstimateStore finds what it saved", () => {
  const store = newMemoryPacingEstimateStore();
  const item = newPacingEstimate("code-555", "name-370");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
