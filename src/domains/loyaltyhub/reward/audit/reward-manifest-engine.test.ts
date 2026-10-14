import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardManifestEngine } from "./reward-manifest-engine.js";
import { newRewardManifest } from "./reward-manifest.js";

test("RewardManifestEngine keeps results within bounds", () => {
  const engine = defaultRewardManifestEngine();
  const item = newRewardManifest("code-260", "title-214");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
