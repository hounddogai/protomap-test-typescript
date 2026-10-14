import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingFunnelRequestView, toRollingFunnelRequestViews } from "./rolling-funnel-request-view.js";
import { newRollingFunnelRequest } from "./rolling-funnel-request.js";

test("RollingFunnelRequestView shows the status in capitals", () => {
  const item = newRollingFunnelRequest("code-897", "title-733");
  const view = toRollingFunnelRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingFunnelRequestViews([item, item]).length, 2, "views");
});
