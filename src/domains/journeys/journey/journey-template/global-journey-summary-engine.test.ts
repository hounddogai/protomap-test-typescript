import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalJourneySummaryEngine } from "./global-journey-summary-engine.js";
import { newGlobalJourneySummary } from "./global-journey-summary.js";

test("GlobalJourneySummaryEngine keeps results within bounds", () => {
  const engine = defaultGlobalJourneySummaryEngine();
  const item = newGlobalJourneySummary("code-675", "title-857");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
