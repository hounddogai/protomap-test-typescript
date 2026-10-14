import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelWindowView, toFunnelWindowViews } from "./funnel-window-view.js";
import { newFunnelWindow } from "./funnel-window.js";

test("FunnelWindowView shows the status in capitals", () => {
  const item = newFunnelWindow("code-147", "name-997");
  const view = toFunnelWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelWindowViews([item, item]).length, 2, "views");
});
