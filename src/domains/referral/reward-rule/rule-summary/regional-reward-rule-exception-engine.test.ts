import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalRewardRuleExceptionEngine } from "./regional-reward-rule-exception-engine.js";
import { newRegionalRewardRuleException } from "./regional-reward-rule-exception.js";

test("RegionalRewardRuleExceptionEngine keeps results within bounds", () => {
  const engine = defaultRegionalRewardRuleExceptionEngine(flags.newRegistry());
  const item = newRegionalRewardRuleException("code-108", "label-628");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
