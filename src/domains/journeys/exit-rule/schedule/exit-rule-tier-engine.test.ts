import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleTierEngine } from "./exit-rule-tier-engine.js";
import { newExitRuleTier } from "./exit-rule-tier.js";

test("ExitRuleTierEngine keeps results within bounds", () => {
  const engine = defaultExitRuleTierEngine();
  const item = newExitRuleTier("code-87", "label-4");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
