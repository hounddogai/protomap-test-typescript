import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredTouchpointSummaryEngine } from "./tiered-touchpoint-summary-engine.js";
import { newTieredTouchpointSummary } from "./tiered-touchpoint-summary.js";

test("TieredTouchpointSummaryEngine keeps results within bounds", () => {
  const engine = defaultTieredTouchpointSummaryEngine(flags.newRegistry());
  const item = newTieredTouchpointSummary("code-616", "name-568");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
