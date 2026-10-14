import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalFunnelRequestView, toRegionalFunnelRequestViews } from "./regional-funnel-request-view.js";
import { newRegionalFunnelRequest } from "./regional-funnel-request.js";

test("RegionalFunnelRequestView shows the status in capitals", () => {
  const item = newRegionalFunnelRequest("code-868", "title-809");
  const view = toRegionalFunnelRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalFunnelRequestViews([item, item]).length, 2, "views");
});
