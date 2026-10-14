import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalFlightSummaryEngine } from "./global-flight-summary-engine.js";
import { newGlobalFlightSummary } from "./global-flight-summary.js";

test("GlobalFlightSummaryEngine keeps results within bounds", () => {
  const engine = defaultGlobalFlightSummaryEngine();
  const item = newGlobalFlightSummary("code-174", "label-657");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
