import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRewardMappingEngine } from "./reward-mapping-engine.js";
import { newRewardMapping } from "./reward-mapping.js";

test("RewardMappingEngine keeps results within bounds", () => {
  const engine = defaultRewardMappingEngine();
  const item = newRewardMapping("code-366", "name-182");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
