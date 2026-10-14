import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualPayoutEstimateEngine } from "./manual-payout-estimate-engine.js";
import { newManualPayoutEstimate } from "./manual-payout-estimate.js";

test("ManualPayoutEstimateEngine keeps results within bounds", () => {
  const engine = defaultManualPayoutEstimateEngine(flags.newRegistry());
  const item = newManualPayoutEstimate("code-564", "label-394");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
