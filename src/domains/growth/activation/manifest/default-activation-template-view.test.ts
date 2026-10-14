import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toDefaultActivationTemplateView,
  toDefaultActivationTemplateViews,
} from "./default-activation-template-view.js";
import { newDefaultActivationTemplate } from "./default-activation-template.js";

test("DefaultActivationTemplateView shows the status in capitals", () => {
  const item = newDefaultActivationTemplate("code-600", "title-496");
  const view = toDefaultActivationTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDefaultActivationTemplateViews([item, item]).length, 2, "views");
});
