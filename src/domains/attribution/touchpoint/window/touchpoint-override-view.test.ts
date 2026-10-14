import assert from "node:assert/strict";
import { test } from "node:test";
import { toTouchpointOverrideView, toTouchpointOverrideViews } from "./touchpoint-override-view.js";
import { newTouchpointOverride } from "./touchpoint-override.js";

test("TouchpointOverrideView shows the status in capitals", () => {
  const item = newTouchpointOverride("code-211", "label-742");
  const view = toTouchpointOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTouchpointOverrideViews([item, item]).length, 2, "views");
});
