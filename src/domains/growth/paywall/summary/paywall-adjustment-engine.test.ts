import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPaywallAdjustmentEngine } from "./paywall-adjustment-engine.js";
import { newPaywallAdjustment } from "./paywall-adjustment.js";

test("PaywallAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultPaywallAdjustmentEngine(flags.newRegistry());
  const item = newPaywallAdjustment("code-652", "name-205");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
