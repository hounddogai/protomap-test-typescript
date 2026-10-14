import assert from "node:assert/strict";
import { test } from "node:test";
import { toFallbackSlaTemplateView, toFallbackSlaTemplateViews } from "./fallback-sla-template-view.js";
import { newFallbackSlaTemplate } from "./fallback-sla-template.js";

test("FallbackSlaTemplateView shows the status in capitals", () => {
  const item = newFallbackSlaTemplate("code-690", "label-234");
  const view = toFallbackSlaTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFallbackSlaTemplateViews([item, item]).length, 2, "views");
});
