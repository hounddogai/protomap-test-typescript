import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledFraudCheckTemplateEngine } from "./scheduled-fraud-check-template-engine.js";
import { newScheduledFraudCheckTemplate } from "./scheduled-fraud-check-template.js";

test("ScheduledFraudCheckTemplateEngine keeps results within bounds", () => {
  const engine = defaultScheduledFraudCheckTemplateEngine(flags.newRegistry());
  const item = newScheduledFraudCheckTemplate("code-689", "title-393");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
