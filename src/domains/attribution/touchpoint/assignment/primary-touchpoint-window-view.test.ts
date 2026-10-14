import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryTouchpointWindowView, toPrimaryTouchpointWindowViews } from "./primary-touchpoint-window-view.js";
import { newPrimaryTouchpointWindow } from "./primary-touchpoint-window.js";

test("PrimaryTouchpointWindowView shows the status in capitals", () => {
  const item = newPrimaryTouchpointWindow("code-753", "label-671");
  const view = toPrimaryTouchpointWindowView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryTouchpointWindowViews([item, item]).length, 2, "views");
});
