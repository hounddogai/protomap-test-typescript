import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingPacingTemplateView, toPendingPacingTemplateViews } from "./pending-pacing-template-view.js";
import { newPendingPacingTemplate } from "./pending-pacing-template.js";

test("PendingPacingTemplateView shows the status in capitals", () => {
  const item = newPendingPacingTemplate("code-190", "title-984");
  const view = toPendingPacingTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingPacingTemplateViews([item, item]).length, 2, "views");
});
