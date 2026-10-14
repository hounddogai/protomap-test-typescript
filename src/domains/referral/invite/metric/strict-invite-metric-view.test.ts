import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictInviteMetricView, toStrictInviteMetricViews } from "./strict-invite-metric-view.js";
import { newStrictInviteMetric } from "./strict-invite-metric.js";

test("StrictInviteMetricView shows the status in capitals", () => {
  const item = newStrictInviteMetric("code-466", "name-267");
  const view = toStrictInviteMetricView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictInviteMetricViews([item, item]).length, 2, "views");
});
