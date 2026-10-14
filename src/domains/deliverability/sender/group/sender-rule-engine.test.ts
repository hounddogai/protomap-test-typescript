import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderRuleEngine } from "./sender-rule-engine.js";
import { newSenderRule } from "./sender-rule.js";

test("SenderRuleEngine keeps results within bounds", () => {
  const engine = defaultSenderRuleEngine(flags.newRegistry());
  const item = newSenderRule("code-798", "title-202");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
