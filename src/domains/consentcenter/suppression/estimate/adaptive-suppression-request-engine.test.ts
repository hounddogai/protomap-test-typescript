import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveSuppressionRequestEngine } from "./adaptive-suppression-request-engine.js";
import { newAdaptiveSuppressionRequest } from "./adaptive-suppression-request.js";

test("AdaptiveSuppressionRequestEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveSuppressionRequestEngine(flags.newRegistry());
  const item = newAdaptiveSuppressionRequest("code-365", "title-401");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
