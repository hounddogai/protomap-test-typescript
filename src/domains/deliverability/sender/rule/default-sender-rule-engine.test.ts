import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultSenderRuleEngine } from "./default-sender-rule-engine.js";
import { newDefaultSenderRule } from "./default-sender-rule.js";

test("DefaultSenderRuleEngine keeps results within bounds", () => {
  const engine = defaultDefaultSenderRuleEngine(flags.newRegistry());
  const item = newDefaultSenderRule("code-759", "name-487");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
