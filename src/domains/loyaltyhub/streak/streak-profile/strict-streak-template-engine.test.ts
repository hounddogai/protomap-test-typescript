import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictStreakTemplateEngine } from "./strict-streak-template-engine.js";
import { newStrictStreakTemplate } from "./strict-streak-template.js";

test("StrictStreakTemplateEngine keeps results within bounds", () => {
  const engine = defaultStrictStreakTemplateEngine(flags.newRegistry());
  const item = newStrictStreakTemplate("code-353", "title-341");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
