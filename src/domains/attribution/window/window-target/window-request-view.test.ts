import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowRequestView, toWindowRequestViews } from "./window-request-view.js";
import { newWindowRequest } from "./window-request.js";

test("WindowRequestView shows the status in capitals", () => {
  const item = newWindowRequest("code-699", "title-550");
  const view = toWindowRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowRequestViews([item, item]).length, 2, "views");
});
