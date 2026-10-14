import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultOptOutTemplateEngine } from "./opt-out-template-engine.js";
import { newOptOutTemplate } from "./opt-out-template.js";

test("OptOutTemplateEngine keeps results within bounds", () => {
  const engine = defaultOptOutTemplateEngine(flags.newRegistry());
  const item = newOptOutTemplate("code-621", "title-985");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
