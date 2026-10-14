import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingWaitRuleEngine } from "./rolling-wait-rule-engine.js";
import { newRollingWaitRule } from "./rolling-wait-rule.js";

test("RollingWaitRuleEngine keeps results within bounds", () => {
  const engine = defaultRollingWaitRuleEngine(flags.newRegistry());
  const item = newRollingWaitRule("code-864", "title-473");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
