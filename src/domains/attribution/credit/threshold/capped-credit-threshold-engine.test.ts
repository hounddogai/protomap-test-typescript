import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedCreditThresholdEngine } from "./capped-credit-threshold-engine.js";
import { newCappedCreditThreshold } from "./capped-credit-threshold.js";

test("CappedCreditThresholdEngine keeps results within bounds", () => {
  const engine = defaultCappedCreditThresholdEngine(flags.newRegistry());
  const item = newCappedCreditThreshold("code-858", "title-394");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
