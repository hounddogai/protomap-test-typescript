import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFunnelTemplateEngine } from "./funnel-template-engine.js";
import { newFunnelTemplate } from "./funnel-template.js";

test("FunnelTemplateEngine keeps results within bounds", () => {
  const engine = defaultFunnelTemplateEngine(flags.newRegistry());
  const item = newFunnelTemplate("code-56", "name-545");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
