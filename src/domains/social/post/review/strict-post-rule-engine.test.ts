import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictPostRuleEngine } from "./strict-post-rule-engine.js";
import { newStrictPostRule } from "./strict-post-rule.js";

test("StrictPostRuleEngine keeps results within bounds", () => {
  const engine = defaultStrictPostRuleEngine(flags.newRegistry());
  const item = newStrictPostRule("code-108", "title-108");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
