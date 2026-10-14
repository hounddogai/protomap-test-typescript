import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalPaywallAllocationEngine } from "./seasonal-paywall-allocation-engine.js";
import { newSeasonalPaywallAllocation } from "./seasonal-paywall-allocation.js";

test("SeasonalPaywallAllocationEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPaywallAllocationEngine();
  const item = newSeasonalPaywallAllocation("code-718", "label-276");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
