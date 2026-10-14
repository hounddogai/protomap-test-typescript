import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleItemEngine } from "./exit-rule-item-engine.js";
import { newExitRuleItem } from "./exit-rule-item.js";

test("ExitRuleItemEngine keeps results within bounds", () => {
  const engine = defaultExitRuleItemEngine();
  const item = newExitRuleItem("code-530", "label-890");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
