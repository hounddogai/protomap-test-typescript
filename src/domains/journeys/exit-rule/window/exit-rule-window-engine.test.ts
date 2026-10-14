import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleWindowEngine } from "./exit-rule-window-engine.js";
import { newExitRuleWindow } from "./exit-rule-window.js";

test("ExitRuleWindowEngine keeps results within bounds", () => {
  const engine = defaultExitRuleWindowEngine();
  const item = newExitRuleWindow("code-417", "name-805");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
