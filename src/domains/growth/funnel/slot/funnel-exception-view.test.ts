import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelExceptionView, toFunnelExceptionViews } from "./funnel-exception-view.js";
import { newFunnelException } from "./funnel-exception.js";

test("FunnelExceptionView shows the status in capitals", () => {
  const item = newFunnelException("code-291", "label-546");
  const view = toFunnelExceptionView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelExceptionViews([item, item]).length, 2, "views");
});
