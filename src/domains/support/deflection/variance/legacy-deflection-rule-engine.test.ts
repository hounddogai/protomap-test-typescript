import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyDeflectionRuleEngine } from "./legacy-deflection-rule-engine.js";
import { newLegacyDeflectionRule } from "./legacy-deflection-rule.js";

test("LegacyDeflectionRuleEngine keeps results within bounds", () => {
  const engine = defaultLegacyDeflectionRuleEngine();
  const item = newLegacyDeflectionRule("code-522", "title-864");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
