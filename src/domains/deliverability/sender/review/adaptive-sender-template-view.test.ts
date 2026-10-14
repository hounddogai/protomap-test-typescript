import assert from "node:assert/strict";
import { test } from "node:test";
import { toAdaptiveSenderTemplateView, toAdaptiveSenderTemplateViews } from "./adaptive-sender-template-view.js";
import { newAdaptiveSenderTemplate } from "./adaptive-sender-template.js";

test("AdaptiveSenderTemplateView shows the status in capitals", () => {
  const item = newAdaptiveSenderTemplate("code-18", "label-815");
  const view = toAdaptiveSenderTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toAdaptiveSenderTemplateViews([item, item]).length, 2, "views");
});
