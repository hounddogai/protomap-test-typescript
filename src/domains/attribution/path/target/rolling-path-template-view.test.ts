import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingPathTemplateView, toRollingPathTemplateViews } from "./rolling-path-template-view.js";
import { newRollingPathTemplate } from "./rolling-path-template.js";

test("RollingPathTemplateView shows the status in capitals", () => {
  const item = newRollingPathTemplate("code-729", "name-297");
  const view = toRollingPathTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingPathTemplateViews([item, item]).length, 2, "views");
});
