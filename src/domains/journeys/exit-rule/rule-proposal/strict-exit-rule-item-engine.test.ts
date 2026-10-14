import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictExitRuleItemEngine } from "./strict-exit-rule-item-engine.js";
import { newStrictExitRuleItem } from "./strict-exit-rule-item.js";

test("StrictExitRuleItemEngine keeps results within bounds", () => {
  const engine = defaultStrictExitRuleItemEngine(flags.newRegistry());
  const item = newStrictExitRuleItem("code-128", "label-323");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
