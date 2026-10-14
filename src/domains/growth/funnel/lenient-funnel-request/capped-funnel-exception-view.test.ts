import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedFunnelExceptionView, toCappedFunnelExceptionViews } from "./capped-funnel-exception-view.js";
import { newCappedFunnelException } from "./capped-funnel-exception.js";

test("CappedFunnelExceptionView shows the status in capitals", () => {
  const item = newCappedFunnelException("code-253", "label-743");
  const view = toCappedFunnelExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedFunnelExceptionViews([item, item]).length, 2, "views");
});
