import assert from "node:assert/strict";
import { test } from "node:test";
import { toDefaultCsatTemplateView, toDefaultCsatTemplateViews } from "./default-csat-template-view.js";
import { newDefaultCsatTemplate } from "./default-csat-template.js";

test("DefaultCsatTemplateView shows the status in capitals", () => {
  const item = newDefaultCsatTemplate("code-459", "name-707");
  const view = toDefaultCsatTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultCsatTemplateViews([item, item]).length, 2, "views");
});
