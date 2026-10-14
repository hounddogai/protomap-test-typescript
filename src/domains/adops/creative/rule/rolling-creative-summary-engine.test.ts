import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingCreativeSummaryEngine } from "./rolling-creative-summary-engine.js";
import { newRollingCreativeSummary } from "./rolling-creative-summary.js";

test("RollingCreativeSummaryEngine keeps results within bounds", () => {
  const engine = defaultRollingCreativeSummaryEngine(flags.newRegistry());
  const item = newRollingCreativeSummary("code-813", "title-203");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
