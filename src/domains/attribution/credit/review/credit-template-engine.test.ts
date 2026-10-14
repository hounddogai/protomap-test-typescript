import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreditTemplateEngine } from "./credit-template-engine.js";
import { newCreditTemplate } from "./credit-template.js";

test("CreditTemplateEngine keeps results within bounds", () => {
  const engine = defaultCreditTemplateEngine();
  const item = newCreditTemplate("code-282", "name-286");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
