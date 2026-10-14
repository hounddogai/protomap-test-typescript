import assert from "node:assert/strict";
import { test } from "node:test";
import { toSuppressionTemplateView, toSuppressionTemplateViews } from "./suppression-template-view.js";
import { newSuppressionTemplate } from "./suppression-template.js";

test("SuppressionTemplateView shows the status in capitals", () => {
  const item = newSuppressionTemplate("code-164", "name-246");
  const view = toSuppressionTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSuppressionTemplateViews([item, item]).length, 2, "views");
});
