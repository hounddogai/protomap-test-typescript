import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientFraudCheckRollupEngine } from "./lenient-fraud-check-rollup-engine.js";
import { newLenientFraudCheckRollup } from "./lenient-fraud-check-rollup.js";

test("LenientFraudCheckRollupEngine keeps results within bounds", () => {
  const engine = defaultLenientFraudCheckRollupEngine(flags.newRegistry());
  const item = newLenientFraudCheckRollup("code-983", "label-283");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
