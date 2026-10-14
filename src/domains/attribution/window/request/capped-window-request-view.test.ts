import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedWindowRequestView, toCappedWindowRequestViews } from "./capped-window-request-view.js";
import { newCappedWindowRequest } from "./capped-window-request.js";

test("CappedWindowRequestView shows the status in capitals", () => {
  const item = newCappedWindowRequest("code-550", "title-357");
  const view = toCappedWindowRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedWindowRequestViews([item, item]).length, 2, "views");
});
