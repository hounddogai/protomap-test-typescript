import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingWindowSummaryEngine } from "./rolling-window-summary-engine.js";
import { newRollingWindowSummary } from "./rolling-window-summary.js";

test("RollingWindowSummaryEngine keeps results within bounds", () => {
  const engine = defaultRollingWindowSummaryEngine(flags.newRegistry());
  const item = newRollingWindowSummary("code-151", "name-761");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
