import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyTemplateView, toReplyTemplateViews } from "./reply-template-view.js";
import { newReplyTemplate } from "./reply-template.js";

test("ReplyTemplateView shows the status in capitals", () => {
  const item = newReplyTemplate("code-627", "label-296");
  const view = toReplyTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyTemplateViews([item, item]).length, 2, "views");
});
