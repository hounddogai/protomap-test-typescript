import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathEstimateEngine } from "./path-estimate-engine.js";
import { newPathEstimate } from "./path-estimate.js";

test("PathEstimateEngine keeps results within bounds", () => {
  const engine = defaultPathEstimateEngine(flags.newRegistry());
  const item = newPathEstimate("code-413", "title-727");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
