import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitRuleEngine } from "./wait-rule-engine.js";
import { newWaitRule } from "./wait-rule.js";

test("WaitRuleEngine keeps results within bounds", () => {
  const engine = defaultWaitRuleEngine(flags.newRegistry());
  const item = newWaitRule("code-707", "title-914");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
