import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalRewardRuleEngine } from "./seasonal-reward-rule-engine.js";
import { newSeasonalRewardRule } from "./seasonal-reward-rule.js";

test("SeasonalRewardRuleEngine keeps results within bounds", () => {
  const engine = defaultSeasonalRewardRuleEngine();
  const item = newSeasonalRewardRule("code-4", "title-715");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
