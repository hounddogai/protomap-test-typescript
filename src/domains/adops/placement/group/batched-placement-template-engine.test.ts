import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedPlacementTemplateEngine } from "./batched-placement-template-engine.js";
import { newBatchedPlacementTemplate } from "./batched-placement-template.js";

test("BatchedPlacementTemplateEngine keeps results within bounds", () => {
  const engine = defaultBatchedPlacementTemplateEngine(flags.newRegistry());
  const item = newBatchedPlacementTemplate("code-837", "label-233");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
