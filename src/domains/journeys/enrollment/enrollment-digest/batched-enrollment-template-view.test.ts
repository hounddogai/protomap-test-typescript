import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toBatchedEnrollmentTemplateView,
  toBatchedEnrollmentTemplateViews,
} from "./batched-enrollment-template-view.js";
import { newBatchedEnrollmentTemplate } from "./batched-enrollment-template.js";

test("BatchedEnrollmentTemplateView shows the status in capitals", () => {
  const item = newBatchedEnrollmentTemplate("code-838", "label-213");
  const view = toBatchedEnrollmentTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toBatchedEnrollmentTemplateViews([item, item]).length, 2, "views");
});
