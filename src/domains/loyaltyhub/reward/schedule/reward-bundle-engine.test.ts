import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardBundleEngine } from "./reward-bundle-engine.js";
import { newRewardBundle } from "./reward-bundle.js";

test("RewardBundleEngine keeps results within bounds", () => {
  const engine = defaultRewardBundleEngine();
  const item = newRewardBundle("code-724", "label-3");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
