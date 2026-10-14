import assert from "node:assert/strict";
import { test } from "node:test";
import { toTicketViewMetricView, toTicketViewMetricViews } from "./ticket-view-metric-view.js";
import { newTicketViewMetric } from "./ticket-view-metric.js";

test("TicketViewMetricView shows the status in capitals", () => {
  const item = newTicketViewMetric("code-52", "title-792");
  const view = toTicketViewMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTicketViewMetricViews([item, item]).length, 2, "views");
});
