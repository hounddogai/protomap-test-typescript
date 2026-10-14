import assert from "node:assert/strict";
import { test } from "node:test";
import { toWaitTemplateView, toWaitTemplateViews } from "./wait-template-view.js";
import { newWaitTemplate } from "./wait-template.js";

test("WaitTemplateView shows the status in capitals", () => {
  const item = newWaitTemplate("code-404", "title-583");
  const view = toWaitTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWaitTemplateViews([item, item]).length, 2, "views");
});
