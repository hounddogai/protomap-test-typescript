import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredTouchpointVarianceEngine } from "./tiered-touchpoint-variance-engine.js";
import { newTieredTouchpointVariance } from "./tiered-touchpoint-variance.js";

test("TieredTouchpointVarianceEngine keeps results within bounds", () => {
  const engine = defaultTieredTouchpointVarianceEngine(flags.newRegistry());
  const item = newTieredTouchpointVariance("code-17", "label-609");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
