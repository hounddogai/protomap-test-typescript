import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryExitRuleTierEngine } from "./primary-exit-rule-tier-engine.js";
import { newPrimaryExitRuleTier } from "./primary-exit-rule-tier.js";

test("PrimaryExitRuleTierEngine keeps results within bounds", () => {
  const engine = defaultPrimaryExitRuleTierEngine(flags.newRegistry());
  const item = newPrimaryExitRuleTier("code-945", "title-466");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
