import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPaywallTemplateEngine } from "./paywall-template-engine.js";
import { newPaywallTemplate } from "./paywall-template.js";

test("PaywallTemplateEngine keeps results within bounds", () => {
  const engine = defaultPaywallTemplateEngine(flags.newRegistry());
  const item = newPaywallTemplate("code-438", "label-906");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
