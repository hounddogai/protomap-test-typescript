import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaWindowView, toSlaWindowViews } from "./sla-window-view.js";
import { newSlaWindow } from "./sla-window.js";

test("SlaWindowView shows the status in capitals", () => {
  const item = newSlaWindow("code-699", "label-140");
  const view = toSlaWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaWindowViews([item, item]).length, 2, "views");
});
