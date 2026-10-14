import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledInsightTemplateEngine } from "./scheduled-insight-template-engine.js";
import { newScheduledInsightTemplate } from "./scheduled-insight-template.js";

test("ScheduledInsightTemplateEngine keeps results within bounds", () => {
  const engine = defaultScheduledInsightTemplateEngine(flags.newRegistry());
  const item = newScheduledInsightTemplate("code-22", "title-572");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
