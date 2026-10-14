import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreativeTemplateView, toCreativeTemplateViews } from "./creative-template-view.js";
import { newCreativeTemplate } from "./creative-template.js";

test("CreativeTemplateView shows the status in capitals", () => {
  const item = newCreativeTemplate("code-756", "name-322");
  const view = toCreativeTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreativeTemplateViews([item, item]).length, 2, "views");
});
