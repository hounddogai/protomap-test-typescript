import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveQueueTemplateEngine } from "./adaptive-queue-template-engine.js";
import { newAdaptiveQueueTemplate } from "./adaptive-queue-template.js";

test("AdaptiveQueueTemplateEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveQueueTemplateEngine(flags.newRegistry());
  const item = newAdaptiveQueueTemplate("code-756", "label-858");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
