import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultExitRuleClaimEngine } from "./default-exit-rule-claim-engine.js";
import { newDefaultExitRuleClaim } from "./default-exit-rule-claim.js";

test("DefaultExitRuleClaimEngine keeps results within bounds", () => {
  const engine = defaultDefaultExitRuleClaimEngine(flags.newRegistry());
  const item = newDefaultExitRuleClaim("code-708", "label-554");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
