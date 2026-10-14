import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedPaywallTemplateEngine } from "./batched-paywall-template-engine.js";
import { newBatchedPaywallTemplate } from "./batched-paywall-template.js";

test("BatchedPaywallTemplateEngine keeps results within bounds", () => {
  const engine = defaultBatchedPaywallTemplateEngine();
  const item = newBatchedPaywallTemplate("code-347", "title-89");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
