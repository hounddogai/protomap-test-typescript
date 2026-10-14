import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleExceptionEngine } from "./exit-rule-exception-engine.js";
import { newExitRuleException } from "./exit-rule-exception.js";

test("ExitRuleExceptionEngine keeps results within bounds", () => {
  const engine = defaultExitRuleExceptionEngine();
  const item = newExitRuleException("code-51", "name-595");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
