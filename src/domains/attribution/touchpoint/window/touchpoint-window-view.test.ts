import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointWindowView, toTouchpointWindowViews } from "./touchpoint-window-view.js";
import { newTouchpointWindow } from "./touchpoint-window.js";

test("TouchpointWindowView shows the status in capitals", () => {
  const item = newTouchpointWindow("code-988", "name-857");
  const view = toTouchpointWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointWindowViews([item, item]).length, 2, "views");
});
