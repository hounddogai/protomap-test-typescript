import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCreativeTemplateView, toPendingCreativeTemplateViews } from "./pending-creative-template-view.js";
import { newPendingCreativeTemplate } from "./pending-creative-template.js";

test("PendingCreativeTemplateView shows the status in capitals", () => {
  const item = newPendingCreativeTemplate("code-7", "name-656");
  const view = toPendingCreativeTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCreativeTemplateViews([item, item]).length, 2, "views");
});
