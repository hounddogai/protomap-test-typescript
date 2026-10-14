import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptivePaywallTemplateEngine } from "./adaptive-paywall-template-engine.js";
import { newAdaptivePaywallTemplate } from "./adaptive-paywall-template.js";

test("AdaptivePaywallTemplateEngine keeps results within bounds", () => {
  const engine = defaultAdaptivePaywallTemplateEngine(flags.newRegistry());
  const item = newAdaptivePaywallTemplate("code-630", "name-444");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
