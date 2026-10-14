import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultProofRuleEngine } from "./default-proof-rule-engine.js";
import { newDefaultProofRule } from "./default-proof-rule.js";

test("DefaultProofRuleEngine keeps results within bounds", () => {
  const engine = defaultDefaultProofRuleEngine(flags.newRegistry());
  const item = newDefaultProofRule("code-683", "title-433");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
