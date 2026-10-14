import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalRewardThresholdStore } from "./seasonal-reward-threshold-store.js";
import { newSeasonalRewardThreshold } from "./seasonal-reward-threshold.js";

test("MemorySeasonalRewardThresholdStore finds what it saved", () => {
  const store = newMemorySeasonalRewardThresholdStore();
  const item = newSeasonalRewardThreshold("code-702", "name-484");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
