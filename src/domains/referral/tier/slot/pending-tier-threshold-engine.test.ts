import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingTierThresholdEngine } from "./pending-tier-threshold-engine.js";
import { newPendingTierThreshold } from "./pending-tier-threshold.js";

test("PendingTierThresholdEngine keeps results within bounds", () => {
  const engine = defaultPendingTierThresholdEngine();
  const item = newPendingTierThreshold("code-749", "title-385");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
