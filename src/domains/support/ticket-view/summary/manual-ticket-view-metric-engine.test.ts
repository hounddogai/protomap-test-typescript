import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualTicketViewMetricEngine } from "./manual-ticket-view-metric-engine.js";
import { newManualTicketViewMetric } from "./manual-ticket-view-metric.js";

test("ManualTicketViewMetricEngine keeps results within bounds", () => {
  const engine = defaultManualTicketViewMetricEngine(flags.newRegistry());
  const item = newManualTicketViewMetric("code-750", "title-596");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
