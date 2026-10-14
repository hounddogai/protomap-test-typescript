import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictStreakTemplateView, toStrictStreakTemplateViews } from "./strict-streak-template-view.js";
import { newStrictStreakTemplate } from "./strict-streak-template.js";

test("StrictStreakTemplateView shows the status in capitals", () => {
  const item = newStrictStreakTemplate("code-353", "title-341");
  const view = toStrictStreakTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictStreakTemplateViews([item, item]).length, 2, "views");
});
