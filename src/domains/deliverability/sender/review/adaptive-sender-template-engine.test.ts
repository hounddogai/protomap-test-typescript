import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveSenderTemplateEngine } from "./adaptive-sender-template-engine.js";
import { newAdaptiveSenderTemplate } from "./adaptive-sender-template.js";

test("AdaptiveSenderTemplateEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveSenderTemplateEngine(flags.newRegistry());
  const item = newAdaptiveSenderTemplate("code-18", "label-815");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
