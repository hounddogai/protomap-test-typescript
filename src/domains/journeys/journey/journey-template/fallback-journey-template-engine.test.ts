import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackJourneyTemplateEngine } from "./fallback-journey-template-engine.js";
import { newFallbackJourneyTemplate } from "./fallback-journey-template.js";

test("FallbackJourneyTemplateEngine keeps results within bounds", () => {
  const engine = defaultFallbackJourneyTemplateEngine(flags.newRegistry());
  const item = newFallbackJourneyTemplate("code-5", "title-226");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
