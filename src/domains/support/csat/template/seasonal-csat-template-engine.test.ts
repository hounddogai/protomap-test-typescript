import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalCsatTemplateEngine } from "./seasonal-csat-template-engine.js";
import { newSeasonalCsatTemplate } from "./seasonal-csat-template.js";

test("SeasonalCsatTemplateEngine keeps results within bounds", () => {
  const engine = defaultSeasonalCsatTemplateEngine(flags.newRegistry());
  const item = newSeasonalCsatTemplate("code-683", "label-696");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
