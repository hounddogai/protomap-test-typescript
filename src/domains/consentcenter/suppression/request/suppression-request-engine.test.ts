import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSuppressionRequestEngine } from "./suppression-request-engine.js";
import { newSuppressionRequest } from "./suppression-request.js";

test("SuppressionRequestEngine keeps results within bounds", () => {
  const engine = defaultSuppressionRequestEngine(flags.newRegistry());
  const item = newSuppressionRequest("code-188", "label-440");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
