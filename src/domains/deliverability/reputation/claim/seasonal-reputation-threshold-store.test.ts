import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalReputationThresholdStore } from "./seasonal-reputation-threshold-store.js";
import { newSeasonalReputationThreshold } from "./seasonal-reputation-threshold.js";

test("MemorySeasonalReputationThresholdStore finds what it saved", () => {
  const store = newMemorySeasonalReputationThresholdStore();
  const item = newSeasonalReputationThreshold("code-46", "label-850");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
