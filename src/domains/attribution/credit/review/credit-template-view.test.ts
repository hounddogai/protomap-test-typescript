import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditTemplateView, toCreditTemplateViews } from "./credit-template-view.js";
import { newCreditTemplate } from "./credit-template.js";

test("CreditTemplateView shows the status in capitals", () => {
  const item = newCreditTemplate("code-282", "name-286");
  const view = toCreditTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditTemplateViews([item, item]).length, 2, "views");
});
