import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaTemplateView, toSlaTemplateViews } from "./sla-template-view.js";
import { newSlaTemplate } from "./sla-template.js";

test("SlaTemplateView shows the status in capitals", () => {
  const item = newSlaTemplate("code-698", "label-321");
  const view = toSlaTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaTemplateViews([item, item]).length, 2, "views");
});
