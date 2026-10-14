import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroEstimateEngine } from "./macro-estimate-engine.js";
import { newMacroEstimate } from "./macro-estimate.js";

test("MacroEstimateEngine keeps results within bounds", () => {
  const engine = defaultMacroEstimateEngine(flags.newRegistry());
  const item = newMacroEstimate("code-69", "title-846");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
