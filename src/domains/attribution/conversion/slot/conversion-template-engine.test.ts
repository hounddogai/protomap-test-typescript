import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionTemplateEngine } from "./conversion-template-engine.js";
import { newConversionTemplate } from "./conversion-template.js";

test("ConversionTemplateEngine keeps results within bounds", () => {
  const engine = defaultConversionTemplateEngine(flags.newRegistry());
  const item = newConversionTemplate("code-324", "name-463");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
