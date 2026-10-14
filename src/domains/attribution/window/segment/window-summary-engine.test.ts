import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowSummaryEngine } from "./window-summary-engine.js";
import { newWindowSummary } from "./window-summary.js";

test("WindowSummaryEngine keeps results within bounds", () => {
  const engine = defaultWindowSummaryEngine();
  const item = newWindowSummary("code-868", "label-107");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
