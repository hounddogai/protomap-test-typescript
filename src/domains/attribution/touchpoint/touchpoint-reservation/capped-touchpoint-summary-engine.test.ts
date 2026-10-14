import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedTouchpointSummaryEngine } from "./capped-touchpoint-summary-engine.js";
import { newCappedTouchpointSummary } from "./capped-touchpoint-summary.js";

test("CappedTouchpointSummaryEngine keeps results within bounds", () => {
  const engine = defaultCappedTouchpointSummaryEngine(flags.newRegistry());
  const item = newCappedTouchpointSummary("code-682", "title-886");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
