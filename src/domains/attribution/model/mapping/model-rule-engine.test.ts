import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelRuleEngine } from "./model-rule-engine.js";
import { newModelRule } from "./model-rule.js";

test("ModelRuleEngine keeps results within bounds", () => {
  const engine = defaultModelRuleEngine(flags.newRegistry());
  const item = newModelRule("code-604", "name-216");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
