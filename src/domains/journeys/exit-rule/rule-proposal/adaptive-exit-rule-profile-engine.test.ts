import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveExitRuleProfileEngine } from "./adaptive-exit-rule-profile-engine.js";
import { newAdaptiveExitRuleProfile } from "./adaptive-exit-rule-profile.js";

test("AdaptiveExitRuleProfileEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveExitRuleProfileEngine(flags.newRegistry());
  const item = newAdaptiveExitRuleProfile("code-35", "label-49");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
