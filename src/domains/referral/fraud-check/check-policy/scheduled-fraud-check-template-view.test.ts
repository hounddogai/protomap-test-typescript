import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toScheduledFraudCheckTemplateView,
  toScheduledFraudCheckTemplateViews,
} from "./scheduled-fraud-check-template-view.js";
import { newScheduledFraudCheckTemplate } from "./scheduled-fraud-check-template.js";

test("ScheduledFraudCheckTemplateView shows the status in capitals", () => {
  const item = newScheduledFraudCheckTemplate("code-689", "title-393");
  const view = toScheduledFraudCheckTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toScheduledFraudCheckTemplateViews([item, item]).length, 2, "views");
});
