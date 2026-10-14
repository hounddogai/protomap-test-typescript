import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitEstimateEngine } from "./wait-estimate-engine.js";
import { newWaitEstimate } from "./wait-estimate.js";

test("WaitEstimateEngine keeps results within bounds", () => {
  const engine = defaultWaitEstimateEngine(flags.newRegistry());
  const item = newWaitEstimate("code-949", "name-886");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
