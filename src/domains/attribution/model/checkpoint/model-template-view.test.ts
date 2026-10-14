import assert from "node:assert/strict";
import { test } from "node:test";
import { toModelTemplateView, toModelTemplateViews } from "./model-template-view.js";
import { newModelTemplate } from "./model-template.js";

test("ModelTemplateView shows the status in capitals", () => {
  const item = newModelTemplate("code-613", "name-345");
  const view = toModelTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toModelTemplateViews([item, item]).length, 2, "views");
});
