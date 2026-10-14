import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckTemplateView, toFraudCheckTemplateViews } from "./fraud-check-template-view.js";
import { newFraudCheckTemplate } from "./fraud-check-template.js";

test("FraudCheckTemplateView shows the status in capitals", () => {
  const item = newFraudCheckTemplate("code-268", "label-682");
  const view = toFraudCheckTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckTemplateViews([item, item]).length, 2, "views");
});
