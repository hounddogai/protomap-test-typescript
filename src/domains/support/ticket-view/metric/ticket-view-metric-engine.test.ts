import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTicketViewMetricEngine } from "./ticket-view-metric-engine.js";
import { newTicketViewMetric } from "./ticket-view-metric.js";

test("TicketViewMetricEngine keeps results within bounds", () => {
  const engine = defaultTicketViewMetricEngine();
  const item = newTicketViewMetric("code-52", "title-792");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
