import assert from "node:assert/strict";
import { test } from "node:test";
import { toFunnelTemplateView, toFunnelTemplateViews } from "./funnel-template-view.js";
import { newFunnelTemplate } from "./funnel-template.js";

test("FunnelTemplateView shows the status in capitals", () => {
  const item = newFunnelTemplate("code-56", "name-545");
  const view = toFunnelTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFunnelTemplateViews([item, item]).length, 2, "views");
});
