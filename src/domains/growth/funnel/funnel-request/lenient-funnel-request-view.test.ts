import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientFunnelRequestView, toLenientFunnelRequestViews } from "./lenient-funnel-request-view.js";
import { newLenientFunnelRequest } from "./lenient-funnel-request.js";

test("LenientFunnelRequestView shows the status in capitals", () => {
  const item = newLenientFunnelRequest("code-17", "title-931");
  const view = toLenientFunnelRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientFunnelRequestViews([item, item]).length, 2, "views");
});
