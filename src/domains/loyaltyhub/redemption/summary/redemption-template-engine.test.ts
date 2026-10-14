import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRedemptionTemplateEngine } from "./redemption-template-engine.js";
import { newRedemptionTemplate } from "./redemption-template.js";

test("RedemptionTemplateEngine keeps results within bounds", () => {
  const engine = defaultRedemptionTemplateEngine(flags.newRegistry());
  const item = newRedemptionTemplate("code-311", "title-547");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
