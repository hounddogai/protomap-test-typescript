import assert from "node:assert/strict";
import { test } from "node:test";
import { toScheduledWarmupTemplateView, toScheduledWarmupTemplateViews } from "./scheduled-warmup-template-view.js";
import { newScheduledWarmupTemplate } from "./scheduled-warmup-template.js";

test("ScheduledWarmupTemplateView shows the status in capitals", () => {
  const item = newScheduledWarmupTemplate("code-361", "title-70");
  const view = toScheduledWarmupTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledWarmupTemplateViews([item, item]).length, 2, "views");
});
