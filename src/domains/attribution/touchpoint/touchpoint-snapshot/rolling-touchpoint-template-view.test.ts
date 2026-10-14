import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toRollingTouchpointTemplateView,
  toRollingTouchpointTemplateViews,
} from "./rolling-touchpoint-template-view.js";
import { newRollingTouchpointTemplate } from "./rolling-touchpoint-template.js";

test("RollingTouchpointTemplateView shows the status in capitals", () => {
  const item = newRollingTouchpointTemplate("code-538", "title-44");
  const view = toRollingTouchpointTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingTouchpointTemplateViews([item, item]).length, 2, "views");
});
