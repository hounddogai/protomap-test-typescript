import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryPaywallTemplateEngine } from "./primary-paywall-template-engine.js";
import { newPrimaryPaywallTemplate } from "./primary-paywall-template.js";

test("PrimaryPaywallTemplateEngine keeps results within bounds", () => {
  const engine = defaultPrimaryPaywallTemplateEngine();
  const item = newPrimaryPaywallTemplate("code-930", "name-654");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
