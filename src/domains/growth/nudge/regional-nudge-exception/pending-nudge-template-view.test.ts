import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingNudgeTemplateView, toPendingNudgeTemplateViews } from "./pending-nudge-template-view.js";
import { newPendingNudgeTemplate } from "./pending-nudge-template.js";

test("PendingNudgeTemplateView shows the status in capitals", () => {
  const item = newPendingNudgeTemplate("code-320", "title-974");
  const view = toPendingNudgeTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingNudgeTemplateViews([item, item]).length, 2, "views");
});
