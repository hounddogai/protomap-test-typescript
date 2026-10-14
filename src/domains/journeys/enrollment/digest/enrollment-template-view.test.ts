import assert from "node:assert/strict";
import { test } from "node:test";
import { toEnrollmentTemplateView, toEnrollmentTemplateViews } from "./enrollment-template-view.js";
import { newEnrollmentTemplate } from "./enrollment-template.js";

test("EnrollmentTemplateView shows the status in capitals", () => {
  const item = newEnrollmentTemplate("code-514", "name-610");
  const view = toEnrollmentTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toEnrollmentTemplateViews([item, item]).length, 2, "views");
});
