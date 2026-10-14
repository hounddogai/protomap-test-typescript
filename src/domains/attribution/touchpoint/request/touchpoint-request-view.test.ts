import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointRequestView, toTouchpointRequestViews } from "./touchpoint-request-view.js";
import { newTouchpointRequest } from "./touchpoint-request.js";

test("TouchpointRequestView shows the status in capitals", () => {
  const item = newTouchpointRequest("code-139", "name-183");
  const view = toTouchpointRequestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointRequestViews([item, item]).length, 2, "views");
});
