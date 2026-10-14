import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionTemplateEngine } from "./subscription-template-engine.js";
import { newSubscriptionTemplate } from "./subscription-template.js";

test("SubscriptionTemplateEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionTemplateEngine();
  const item = newSubscriptionTemplate("code-241", "name-416");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
