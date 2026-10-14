import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalExitRuleBundleEngine } from "./global-exit-rule-bundle-engine.js";
import { newGlobalExitRuleBundle } from "./global-exit-rule-bundle.js";

test("GlobalExitRuleBundleEngine keeps results within bounds", () => {
  const engine = defaultGlobalExitRuleBundleEngine(flags.newRegistry());
  const item = newGlobalExitRuleBundle("code-186", "name-44");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
