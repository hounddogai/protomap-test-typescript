import assert from "node:assert/strict";
import { test } from "node:test";
import { toSeasonalCsatTemplateView, toSeasonalCsatTemplateViews } from "./seasonal-csat-template-view.js";
import { newSeasonalCsatTemplate } from "./seasonal-csat-template.js";

test("SeasonalCsatTemplateView shows the status in capitals", () => {
  const item = newSeasonalCsatTemplate("code-683", "label-696");
  const view = toSeasonalCsatTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSeasonalCsatTemplateViews([item, item]).length, 2, "views");
});
