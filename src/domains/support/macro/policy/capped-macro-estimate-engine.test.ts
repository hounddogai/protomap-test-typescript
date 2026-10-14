import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedMacroEstimateEngine } from "./capped-macro-estimate-engine.js";
import { newCappedMacroEstimate } from "./capped-macro-estimate.js";

test("CappedMacroEstimateEngine keeps results within bounds", () => {
  const engine = defaultCappedMacroEstimateEngine(flags.newRegistry());
  const item = newCappedMacroEstimate("code-861", "label-856");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
