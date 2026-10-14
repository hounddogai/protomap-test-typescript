import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardRuleEntryEngine } from "./reward-rule-entry-engine.js";
import { newRewardRuleEntry } from "./reward-rule-entry.js";

test("RewardRuleEntryEngine keeps results within bounds", () => {
  const engine = defaultRewardRuleEntryEngine(flags.newRegistry());
  const item = newRewardRuleEntry("code-801", "name-883");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
