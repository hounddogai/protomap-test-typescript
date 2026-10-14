import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictFraudCheckTemplateView,
  toStrictFraudCheckTemplateViews,
} from "./strict-fraud-check-template-view.js";
import { newStrictFraudCheckTemplate } from "./strict-fraud-check-template.js";

test("StrictFraudCheckTemplateView shows the status in capitals", () => {
  const item = newStrictFraudCheckTemplate("code-162", "title-913");
  const view = toStrictFraudCheckTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictFraudCheckTemplateViews([item, item]).length, 2, "views");
});
