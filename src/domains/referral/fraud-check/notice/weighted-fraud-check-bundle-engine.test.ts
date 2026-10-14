import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedFraudCheckBundleEngine } from "./weighted-fraud-check-bundle-engine.js";
import { newWeightedFraudCheckBundle } from "./weighted-fraud-check-bundle.js";

test("WeightedFraudCheckBundleEngine keeps results within bounds", () => {
  const engine = defaultWeightedFraudCheckBundleEngine(flags.newRegistry());
  const item = newWeightedFraudCheckBundle("code-971", "label-713");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
