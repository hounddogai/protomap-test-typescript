import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredActivationEstimateEngine } from "./tiered-activation-estimate-engine.js";
import { newTieredActivationEstimate } from "./tiered-activation-estimate.js";

test("TieredActivationEstimateEngine keeps results within bounds", () => {
  const engine = defaultTieredActivationEstimateEngine(flags.newRegistry());
  const item = newTieredActivationEstimate("code-912", "name-439");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
