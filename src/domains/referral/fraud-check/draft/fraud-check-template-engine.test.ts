import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFraudCheckTemplateEngine } from "./fraud-check-template-engine.js";
import { newFraudCheckTemplate } from "./fraud-check-template.js";

test("FraudCheckTemplateEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckTemplateEngine();
  const item = newFraudCheckTemplate("code-268", "label-682");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
