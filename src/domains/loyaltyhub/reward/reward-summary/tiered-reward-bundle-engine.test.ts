import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTieredRewardBundleEngine } from "./tiered-reward-bundle-engine.js";
import { newTieredRewardBundle } from "./tiered-reward-bundle.js";

test("TieredRewardBundleEngine keeps results within bounds", () => {
  const engine = defaultTieredRewardBundleEngine();
  const item = newTieredRewardBundle("code-57", "name-596");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
